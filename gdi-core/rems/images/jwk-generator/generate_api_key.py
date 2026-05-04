import secrets
import string


def generate_api_key(length: int = 32) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


if __name__ == "__main__":

    # Generate a random API key
    api_key = generate_api_key()
    print("Generated API Key:", api_key)
