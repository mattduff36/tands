const pwd = process.argv[2];
if (!pwd) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  process.exit(1);
}

console.log(pwd);
