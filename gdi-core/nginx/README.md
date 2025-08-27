# Deployment

- Change domains in `nginx/confs_docker/` files and in `get_cert.sh` (in the script, you need to have a `-d` before each domain)
- Run `docker compose up -d nginx && bash get_cert.sh`
- Running the script will prompt you for an email but you can leave it empty to skip it
- After having the certificates, uncomment the port 443 server blocks in `nginx/confs_docker/` files
- Run `docker compose up -d`

