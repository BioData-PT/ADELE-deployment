from authlib.jose import RSAKey
from json import dumps
from os.path import isfile

public_key_file = "jwk/public-key.jwk"
private_key_file = "jwk/private-key.jwk"

if __name__ == "__main__":

    if isfile(public_key_file) and isfile(private_key_file):
        print("The jwk files already exist: Skipping creation")
        exit(0)
    key = RSAKey.generate_key(is_private=True, options={"kid": "gdi-demo"})

    public_jwk = key.as_dict(is_private=False)
    private_jwk = dict(key)

    with open(public_key_file, "w") as f:
        f.write(dumps(public_jwk, indent=4))
        print(f"generated {public_key_file}")
    with open(private_key_file, "w") as f:
        f.write(dumps(private_jwk, indent=4))
        print(f"generated {private_key_file}")
