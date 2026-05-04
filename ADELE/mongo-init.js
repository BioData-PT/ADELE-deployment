db = db.getSiblingDB('users');

db.staff_info.insertMany([
  {
    name: "Administrator",
    username: "admin", 
    password: "pbkdf2:sha256:260000$SLhbGgCa5oeYKzeU$a849d8d83fa87bd8396a4c0d90f2958abfa1ffab9c8883c070c2d9b6feda3f63", 
    role: "ADMIN"
  },
  {
    name: "Backoffice Operator",
    username: "operator",
    password: "pbkdf2:sha256:260000$YnpzglZzwhBQ6bDL$80b060f10dfe0d6aa0d52aa65ad632fa50785e325b70a9e21a91f24910fe4a16",
    role: "TRE-OPERATOR"
  },
  {
    name: "Validator",
    username: "validator",
    password: "pbkdf2:sha256:260000$xIXtiMGpZbKCh04Z$35c99cfb7395fc2e6aabc7337fd3bbd7609e2a0ff0a05b39b4e96176f099e90b",
    role: "OUTPUT-VALIDATOR"
  }
]);
