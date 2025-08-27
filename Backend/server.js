const app = require("./src/app");
require("dotenv").config({ debug: true })
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
