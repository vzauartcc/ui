# Virtual Chicago ARTCC - UI

A Vue SPA for the Virtual Chicago ARTCC Website, using PrimeVue and Tailwind CSS. This communicates with the ZAU API in order to deliver content to users.

[![Import to Doppler](https://raw.githubusercontent.com/DopplerUniversity/app-config-templates/main/doppler-button.svg)](https://dashboard.doppler.com/workplace/template/import?template=https%3A%2F%2Fgithub.com%2Fvzauartcc%2Fui%2Fblob%2Fmain%2Fdoppler-template.yaml)

# Contributors

If you would like to contribute to this repository, please contact wm@zauartcc.org

Thank you to all contributors, past and present.

# Contributing

Prerequisites:

- Most recent LTS of Node.js, with the corresponding version of npm.
- Doppler installed and logged in.
- Have the ZAU API running locally at `http://localhost:3000`.

## Contributing Guidelines and Style

In order to maintain consistent code, please adhere to the following guidelines:

- Working branches should started from the `staging` branch and be named `OI-feature_name` where `OI` is your operating initials and `feature_name` is a brief description of the feature (`II-feedback_form` or `DJ-admin_stats_page`). Please make sure to follow the capitalization standards.
- When you have completed your updates, push them to your branch, and then open a merge request to `staging` in GitHub.
- Please ensure your editor is set up to work with prettier for code formatting. `oxfmt` is used for this project. Use `npm run format` to format your code.
- Please ensure all linting and typescript errors are resolved before submitting a merge request. Use `npm run lint` to run the linter, and `npm run type-check` to run the typescript compiler.
