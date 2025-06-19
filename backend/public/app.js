console.log("Frontend aplikacija je pokrenuta!");

document.addEventListener('DOMContentLoaded', () => {
    const heading = document.querySelector('h1');
    if (heading) {
        heading.textContent = "Planer Obroka: Spremni za akciju!";
    }
});