require("dotenv").config();

const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken"); 
const mysql = require("mysql2/promise");
const cors = require("cors"); 
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;
const DB_PORT = process.env.DB_PORT;
const JWT_SECRET = process.env.JWT_SECRET;

if (
  !DB_HOST ||
  !DB_USER ||
  !DB_PASSWORD ||
  !DB_NAME ||
  !JWT_SECRET ||
  !DB_PORT
) {
  console.error(
    "KRITIČNA GREŠKA: Jedna ili više .env varijabli (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, JWT_SECRET) nisu definisane."
  );
  process.exit(1);
}

const UserRepository = require("./layers/dataAccess/UserRepository");
const RecipeRepository = require("./layers/dataAccess/RecipeRepository");
const MealPlanRepository = require("./layers/dataAccess/MealPlanRepository");
const UserService = require("./layers/businessLogic/UserService");
const RecipeService = require("./layers/businessLogic/RecipeService");
const MealPlannerService = require("./layers/businessLogic/MealPlannerService");
const app = express();
const PORT = process.env.PORT || 3000;
let dbConnection;

async function initializeApp() {
  try {
    dbConnection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT,
    });
    console.log("Uspešno povezano sa MySQL bazom!");
    const [rows] = await dbConnection.execute("SELECT 2 + 2 AS solution");
    console.log("MySQL test query result:", rows[0].solution);
    app.locals.db = dbConnection; 
    app.locals.userRepository = new UserRepository(dbConnection);
    app.locals.recipeRepository = new RecipeRepository(dbConnection);
    app.locals.mealPlanRepository = new MealPlanRepository(dbConnection); 
    app.locals.userService = new UserService(app.locals.userRepository);
    app.locals.recipeService = new RecipeService(app.locals.recipeRepository);
    app.locals.mealPlannerService = new MealPlannerService(
      app.locals.mealPlanRepository,
      app.locals.recipeRepository
    );
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(
      cors({
        origin: "http://localhost:4200",
      })
    );
    app.use(express.static(path.join(__dirname, "../../public")));
    app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "../../public", "index.html"));
    });

    app.post("/api/register", async (req, res) => {
      const { email, password } = req.body;
      const userService = req.app.locals.userService;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email i lozinka su obavezni." });
      }

      try {
        const userId = await userService.registerUser(email, password);
        if (userId) {
          res
            .status(201)
            .json({ message: "Korisnik uspešno registrovan!", userId: userId });
        } else {
          res
            .status(409)
            .json({ message: "Korisnik sa ovim emailom već postoji." });
        }
      } catch (error) {
        console.error("Greška pri registraciji korisnika:", error);
        res
          .status(500)
          .json({
            message: "Došlo je do greške na serveru prilikom registracije.",
          });
      }
    });

    app.post("/api/login", async (req, res) => {
      const { email, password } = req.body;
      const userService = req.app.locals.userService;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email i lozinka su obavezni." });
      }

      try {
        const result = await userService.loginUser(email, password);
        if (result) {
          res
            .status(200)
            .json({
              message: "Uspešna prijava!",
              user: result.user,
              token: result.token,
            });
        } else {
          res.status(401).json({ message: "Netačan email ili lozinka." });
        }
      } catch (error) {
        console.error("Greška pri prijavi korisnika:", error);
        res
          .status(500)
          .json({ message: "Došlo je do greške na serveru prilikom prijave." });
      }
    });

    function authenticateToken(req, res, next) {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (token == null) {
        return res
          .status(401)
          .json({ message: "Autorizacioni token je obavezan." });
      }

      jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
          console.error("JWT verifikacija neuspešna:", err.message);
          return res
            .status(403)
            .json({ message: "Token nije validan ili je istekao." }); 
        }
        req.user = user; 
        next(); 
      });
    }

    app.post("/api/recipes", authenticateToken, async (req, res) => {
      const {
        title,
        description,
        ingredients,
        instructions,
        preparation_time,
        cooking_time,
        servings,
        cuisine,
      } = req.body;
      const userId = req.user.id; 
      const recipeService = req.app.locals.recipeService; 

      if (!title || !ingredients || !instructions) {
        return res
          .status(400)
          .json({
            message: "Naziv, sastojci i uputstva su obavezni za recept.",
          });
      }

      try {
        const recipeId = await recipeService.createRecipe(userId, {
          title,
          description,
          ingredients,
          instructions,
          preparation_time,
          cooking_time,
          servings,
          cuisine,
        });
        res
          .status(201)
          .json({ message: "Recept uspešno kreiran!", recipeId: recipeId });
      } catch (error) {
        console.error("Greška pri kreiranju recepta:", error);
        res
          .status(500)
          .json({ message: "Greška na serveru prilikom kreiranja recepta." });
      }
    });

    app.get("/api/recipes", authenticateToken, async (req, res) => {
      try {
        const userId = req.user.id;
        const filters = req.query; 

        const recipeService = req.app.locals.recipeService; 
        const recipes = await recipeService.getAllRecipesForUser(
          userId,
          filters
        );
        res.status(200).json(recipes);
      } catch (error) {
        console.error("Greška pri dohvatanju recepata:", error);
        res
          .status(500)
          .json({ message: "Greška na serveru prilikom dohvatanja recepata." });
      }
    });

    app.get("/api/recipes/:recipeId", authenticateToken, async (req, res) => {
      const recipeId = parseInt(req.params.recipeId);
      const userId = req.user.id; 
      const recipeService = req.app.locals.recipeService; 

      if (isNaN(recipeId)) {
        return res.status(400).json({ message: "Invalidan ID recepta." });
      }

      try {
        const recipe = await recipeService.getRecipeById(recipeId, userId);
        if (recipe) {
          res.status(200).json(recipe);
        } else {
          res
            .status(404)
            .json({ message: "Recept nije pronađen ili nemate dozvolu." });
        }
      } catch (error) {
        console.error("Greška pri dohvatanju recepta:", error);
        res
          .status(500)
          .json({ message: "Greška na serveru prilikom dohvatanja recepta." });
      }
    });

    app.put("/api/recipes/:recipeId", authenticateToken, async (req, res) => {
      const recipeId = parseInt(req.params.recipeId);
      const userId = req.user.id; 
      const {
        title,
        description,
        ingredients,
        instructions,
        preparation_time,
        cooking_time,
        servings,
        cuisine,
      } = req.body;
      const updateData = {
        title,
        description,
        ingredients,
        instructions,
        preparation_time,
        cooking_time,
        servings,
        cuisine,
      };
      const recipeService = req.app.locals.recipeService; 

      if (isNaN(recipeId)) {
        return res.status(400).json({ message: "Invalidan ID recepta." });
      }
      if (!title || !ingredients || !instructions) {
        return res
          .status(400)
          .json({
            message:
              "Naziv, sastojci i uputstva su obavezni za ažuriranje recepta.",
          });
      }

      try {
        const success = await recipeService.updateRecipe(
          recipeId,
          userId,
          updateData
        );
        if (success) {
          res.status(200).json({ message: "Recept uspešno ažuriran." });
        } else {
          res
            .status(404)
            .json({
              message: "Recept nije pronađen ili nemate dozvolu za ažuriranje.",
            });
        }
      } catch (error) {
        console.error("Greška pri ažuriranju recepta:", error);
        res
          .status(500)
          .json({ message: "Greška na serveru prilikom ažuriranja recepta." });
      }
    });

    app.delete(
      "/api/recipes/:recipeId",
      authenticateToken,
      async (req, res) => {
        const recipeId = parseInt(req.params.recipeId);
        const userId = req.user.id; 
        const recipeService = req.app.locals.recipeService; 

        if (isNaN(recipeId)) {
          return res.status(400).json({ message: "Invalidan ID recepta." });
        }

        try {
          const success = await recipeService.deleteRecipe(recipeId, userId);
          if (success) {
            res.status(200).json({ message: "Recept uspešno obrisan." });
          } else {
            res
              .status(404)
              .json({
                message: "Recept nije pronađen ili nemate dozvolu za brisanje.",
              });
          }
        } catch (error) {
          console.error("Greška pri brisanju recepta:", error);
          res
            .status(500)
            .json({ message: "Greška na serveru prilikom brisanja recepta." });
        }
      }
    );

    app.post("/api/mealplans", authenticateToken, async (req, res) => {
      const { name, plan_date, notes } = req.body;
      const userId = req.user.id;
      const mealPlannerService = req.app.locals.mealPlannerService; 

      if (!name || !plan_date) {
        return res
          .status(400)
          .json({ message: "Naziv i datum plana su obavezni." });
      }

      try {
        const mealPlanId = await mealPlannerService.createMealPlan(userId, {
          name,
          plan_date,
          notes,
        });
        res
          .status(201)
          .json({
            message: "Plan obroka uspešno kreiran!",
            mealPlanId: mealPlanId,
          });
      } catch (error) {
        console.error("Greška pri kreiranju plana obroka:", error);
        res
          .status(500)
          .json({
            message: "Greška na serveru prilikom kreiranja plana obroka.",
          });
      }
    });

    app.get("/api/mealplans", authenticateToken, async (req, res) => {
      const userId = req.user.id; 
      const mealPlannerService = req.app.locals.mealPlannerService;
      const { startDate, endDate } = req.query;

      try {
        const mealPlans = await mealPlannerService.getAllMealPlansForUser(
          userId,
          startDate,
          endDate
        );
        res.status(200).json(mealPlans);
      } catch (error) {
        console.error(
          "Greška pri dohvatanju planova obroka za korisnika:",
          error
        );
        res
          .status(500)
          .json({
            message: "Greška na serveru prilikom dohvatanja planova obroka.",
          });
      }
    });

    app.get(
      "/api/mealplans/:mealPlanId",
      authenticateToken,
      async (req, res) => {
        const mealPlanId = parseInt(req.params.mealPlanId);
        const userId = req.user.id; 
        const mealPlannerService = req.app.locals.mealPlannerService; 

        if (isNaN(mealPlanId)) {
          return res
            .status(400)
            .json({ message: "Invalidan ID plana obroka." });
        }

        try {
          const mealPlanDetails = await mealPlannerService.getMealPlanDetails(
            mealPlanId,
            userId
          );
          if (mealPlanDetails) {
            res.status(200).json(mealPlanDetails);
          } else {
            res
              .status(404)
              .json({
                message: "Plan obroka nije pronađen ili nemate dozvolu.",
              });
          }
        } catch (error) {
          console.error("Greška pri dohvatanju detalja plana obroka:", error);
          res
            .status(500)
            .json({
              message:
                "Greška na serveru prilikom dohvatanja detalja plana obroka.",
            });
        }
      }
    );

    app.put(
      "/api/mealplans/:mealPlanId",
      authenticateToken,
      async (req, res) => {
        const mealPlanId = parseInt(req.params.mealPlanId);
        const userId = req.user.id;
        const updateData = req.body;
        const mealPlannerService = req.app.locals.mealPlannerService; 

        if (isNaN(mealPlanId) || Object.keys(updateData).length === 0) {
          return res
            .status(400)
            .json({
              message: "Invalidan ID plana ili podaci za ažuriranje nedostaju.",
            });
        }

        try {
          const success = await mealPlannerService.updateMealPlan(
            mealPlanId,
            userId,
            updateData
          );
          if (success) {
            res.status(200).json({ message: "Plan obroka uspešno ažuriran." });
          } else {
            res
              .status(404)
              .json({
                message:
                  "Plan obroka nije pronađen ili nemate dozvolu za ažuriranje.",
              });
          }
        } catch (error) {
          console.error("Greška pri ažuriranju plana obroka:", error);
          res
            .status(500)
            .json({
              message: "Greška na serveru prilikom ažuriranja plana obroka.",
            });
        }
      }
    );

    app.delete(
      "/api/mealplans/:mealPlanId",
      authenticateToken,
      async (req, res) => {
        const mealPlanId = parseInt(req.params.mealPlanId);
        const userId = req.user.id;
        const mealPlannerService = req.app.locals.mealPlannerService; 

        if (isNaN(mealPlanId)) {
          return res
            .status(400)
            .json({ message: "Invalidan ID plana obroka." });
        }

        try {
          const success = await mealPlannerService.deleteMealPlan(
            mealPlanId,
            userId
          );
          if (success) {
            res.status(200).json({ message: "Plan obroka uspešno obrisan." });
          } else {
            res
              .status(404)
              .json({
                message:
                  "Plan obroka nije pronađen ili nemate dozvolu za brisanje.",
              });
          }
        } catch (error) {
          console.error("Greška pri brisanju plana obroka:", error);
          res
            .status(500)
            .json({
              message: "Greška na serveru prilikom brisanja plana obroka.",
            });
        }
      }
    );

    app.post(
      "/api/mealplans/:mealPlanId/add-recipe",
      authenticateToken,
      async (req, res) => {
        const mealPlanId = parseInt(req.params.mealPlanId);
        const { recipeId, mealType } = req.body;
        const userId = req.user.id;

        const mealPlannerService = req.app.locals.mealPlannerService; 

        if (isNaN(mealPlanId) || !recipeId || !mealType) {
          return res
            .status(400)
            .json({
              message: "ID plana, ID recepta i tip obroka su obavezni.",
            });
        }

        try {
          const entryId = await mealPlannerService.addRecipeToMealPlan(
            mealPlanId,
            recipeId,
            mealType,
            userId
          );
          res
            .status(201)
            .json({
              message: "Recept uspešno dodat u plan obroka!",
              entryId: entryId,
            });
        } catch (error) {
          console.error("Greška pri dodavanju recepta u plan obroka:", error);
          if (
            error.message.includes(
              "Plan obroka nije pronađen ili nemate dozvolu"
            ) ||
            error.message.includes("Recept nije pronađen ili nemate dozvolu")
          ) {
            return res.status(403).json({ message: error.message });
          }
          if (error.code === "ER_DUP_ENTRY") {
            return res
              .status(409)
              .json({
                message: `Recept za '${mealType}' već postoji u ovom planu.`,
              });
          }
          res
            .status(500)
            .json({
              message:
                "Greška na serveru prilikom dodavanja recepta u plan obroka.",
            });
        }
      }
    );

    app.get(
      "/api/mealplans/:mealPlanId/recipes",
      authenticateToken,
      async (req, res) => {
        const mealPlanId = parseInt(req.params.mealPlanId);
        const userId = req.user.id;
        const mealPlannerService = req.app.locals.mealPlannerService; 

        if (isNaN(mealPlanId)) {
          return res
            .status(400)
            .json({ message: "ID plana obroka je neispravan." });
        }

        try {
          const recipes = await mealPlannerService.getRecipesForMealPlan(
            mealPlanId,
            userId
          );
          if (recipes === null) {
            return res
              .status(404)
              .json({
                message: "Plan obroka nije pronađen ili nemate dozvolu.",
              });
          }
          res.status(200).json(recipes);
        } catch (error) {
          console.error(
            "Greška pri dohvatanju recepata za plan obroka:",
            error
          );
          res
            .status(500)
            .json({
              message:
                "Greška na serveru prilikom dohvatanja recepata za plan obroka.",
            });
        }
      }
    );

    app.delete(
      "/api/mealplans/:mealPlanId/remove-recipe/:recipeId",
      authenticateToken,
      async (req, res) => {
        const mealPlanId = parseInt(req.params.mealPlanId);
        const recipeId = parseInt(req.params.recipeId);
        const userId = req.user.id;

        const mealPlannerService = req.app.locals.mealPlannerService; 

        if (isNaN(mealPlanId) || isNaN(recipeId)) {
          return res
            .status(400)
            .json({ message: "Invalidan ID plana ili ID recepta." });
        }

        try {
          const success = await mealPlannerService.removeRecipeFromMealPlan(
            mealPlanId,
            recipeId,
            userId
          );
          if (success) {
            res
              .status(200)
              .json({ message: "Recept uspešno uklonjen iz plana obroka." });
          } else {
            res
              .status(404)
              .json({
                message:
                  "Recept nije pronađen u planu obroka ili nemate dozvolu.",
              });
          }
        } catch (error) {
          console.error(
            "Greška pri uklanjanju recepta iz plana obroka:",
            error
          );
          if (
            error.message.includes(
              "Plan obroka nije pronađen ili nemate dozvolu"
            ) ||
            error.message.includes("Recept nije pronađen ili nemate dozvolu")
          ) {
            return res.status(403).json({ message: error.message });
          }
          res
            .status(500)
            .json({
              message:
                "Greška na serveru prilikom uklanjanja recepta iz plana obroka.",
            });
        }
      }
    );

    app.listen(PORT, () => {
      console.log(`Server pokrenut na portu ${PORT}`);
      console.log(`Posetite http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(
      "Greška pri povezivanju sa bazom ili inicijalizaciji aplikacije:",
      error
    );
    process.exit(1);
  }
}

initializeApp();

process.on("SIGINT", async () => {
  console.log("Server se gasi, zatvaranje konekcije sa bazom...");
  if (dbConnection) {
    await dbConnection.end();
    console.log("MySQL konekcija zatvorena.");
  }
  process.exit(0);
});

process.on("exit", (code) => {
  if (code !== 0 && !dbConnection) {
    console.log(
      `Server je ugašen sa kodom ${code}, ali konekcija sa bazom nije bila uspostavljena.`
    );
  }
});
