module.exports = {
  "extends": "airbnb-base",
  "plugins": [
    "import"
  ],
  "rules": {
    "no-underscore-dangle": "off",
    "no-restricted-syntax": "off",
    "no-unused-vars": ["error", {
      argsIgnorePattern: "^unused",
    }],
  }

};
