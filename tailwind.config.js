/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{html,js,kt}"],
    plugins: [require("daisyui")],
    daisyui: {
        themes: ["light"],
    },
}
