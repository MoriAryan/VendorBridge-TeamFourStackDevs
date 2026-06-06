import bcrypt from "bcrypt";

const hash = await bcrypt.hash("aryan123", 10);
console.log(hash);