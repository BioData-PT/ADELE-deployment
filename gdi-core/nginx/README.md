# Deployment

- Change domains in `nginx/confs_docker/` files and in `get_cert.sh` (in the script, you need to have a `-d` before each domain)
- Comment all the https server blocks (i.e., all that mention port 443). Not doing so will make the nginx container crash because it won't be able to find the certificates
- In the **root directory of the repo**, run `docker compose up -d nginx certbot && bash get_cert.sh`
- Running the script will prompt you for an email but you can leave it empty to skip it
- After having the certificates, uncomment the port 443 server blocks in `nginx/confs_docker/` files
- Run `docker compose restart nginx` in the root directory of the repo

