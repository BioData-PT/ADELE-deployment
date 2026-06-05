# Deployment Guide
In the following section, the steps to deploy the ADELE TRE with all its components are described in detail. The instructions assume a Linux system and that you have experience using vim, but other OS's and text editors can be used as well.

## Pre-requisites
- Docker and Docker Compose plugin
- Git
- Public URL (some services require valid HTTPS connection)
- LS AAI account (see instructions below)

## Get an LS AAI Account
To login on the TRE when you reach production, you need to first create an LS AAI account. To do that, visit [LS AAI Login Page](https://perun.aai.lifescience-ri.eu/login) and sign in. It is preferable that you use the search bar to find an organization to which you belong, but you can also login using ORCID.
After that, you'll need to register at 2 different groups using the following URLs: 
- [LifeScience group](https://signup.aai.lifescience-ri.eu/fed/registrar/?vo=lifescience)
- [LifeScience Test](https://signup.aai.lifescience-ri.eu/fed/registrar/?vo=lifescience_test)
If everything went well, your LS AAI account is now ready to access the TRE!

## Changes before first start-up
- Execute the following command to setup the initial environment from the template:
```bash
cp .env.example .env
```
- Change the values in the _.env_ file to match your configuration. Avoid changing anything below the "INTERNAL" comments, unless you know what you are doing.
- At the start of the _.env_ file, there are 8 fields for domains that you must fill with names that are different among them, and have them all point to the host machine's IP address. Otherwise, it's not possible to run the stack.
- For the OIDC fields, you can use any alphanumeric values while testing or doing a first deployment, but when going to production you need to change them to match the credentials of the OIDC client that you registered in LS AAI (see instructions below).
- For the _REMS\_OWNER\_KEY_, _REPORTER\_API\_KEY_, and _REMS\_API\_KEY_ fields, it is recommended to generate a random API key using `make api-key` for each of them.

## First start-up
To run the stack, execute the following commands in the root directory of the repository:
```bash
docker compose run --rm -e CMD="migrate" rems-app
docker compose up -d
```

If any error pops up, check the logs of the troubled container and look for the configuration in the respective module inside gdi-core.

The first step is to get the configuration running with minimal changes and using a Mock OIDC client. The next steps are going to be to set up a real OIDC client and get valid HTTPS certificates and then change your configuration accordingly.

Check if:
- FAIR Data Point is reachable at `http://localhost:8667/` using curl or a web browser.
- REMS is reachable at `http://localhost:3000/` using curl or a web browser.
- Funnel is reachable at `http://localhost:8010/` using curl.
- Run `docker compose ps -a | grep -i exit` and check that all containers that show up have exited with success (exit code 0).

If any of these services is not behaving as expected, check the logs of the respective container using `docker compose logs <service-name>`.

### Get SSL certificate
Initially, the stack is configured to run with HTTP connections only, without exposing your services (HTTP connections in this stack only redirect to HTTPS). To be able to use HTTPS, you need to obtain an SSL certificate. To do that, run the following command after having configured the domains in the _.env_ file to point to your host machine's IP address:

```bash
make get-cert
```

When the command is executed, it will ask you to choose the domains you want to get certificates for, make sure to select all the domains that you configured in the _.env_ file. After that, it will ask you to provide an email address for the registration of the certificates (you may press enter with an empty email to skip), and then it will automatically obtain the certificates for the stack. If anything fails, check if the domains are correctly configured and pointing to your host machine's IP address, and that there are no firewalls or other network configurations blocking port 80 for connections comming from the outside.

### Create users and API keys in REMS

During the first start-up, you also need to create api keys in REMS for the:
- Owner user - Who will have administrative privileges and can manage the system (you!); 
- Reporter user - Who will be used by the TRE and AAI to get permission information for a queried user;
- Organization owner user - Who will be used by the TRE to manage REMS automatically

The credentials of each user (username and API key) must be added to the _.env_ file in the respective fields (See [Changes before first start-up](#changes-before-first-start-up)) *before* running the command presented below.

It is important to note that the _REMS_OWNER_ field may be filled with the default value "owner" while testing with a Mock AAI but it must be changed to the actual username of the owner user when going to production. This username may be found by logging in any service (_e.g._, REMS) using LS AAI and looking for "Identifier of user on a service" (NOT the "username" field!) when granting the service access to your data. If you don't see this page, just log in REMS with your LS AAI account, go to your profile by clicking on your name on the top right corner, and look for the "Username" field, it shold look something like '3224a1b8718fcb244991e55453b1a3aaebf10e40@lifescience-ri.eu'.

If you have everything ready, run the following command to create the users and API keys in REMS:
```bash
make create-rems-roles
```

*Note*: The command may take a while to run, approximately 2 minutes, don't freak out unless an error pops up.

## Configuration

The section below is not compulsory when testing the stack with a Mock OIDC client, but it is necessary when going to production and using LS AAI as the OIDC provider or when changing the architecture of the stack somehow.

### LS AAI OIDC Client
You need to register an OIDC client in LS AAI for the TRE services to be able to use it as an Identity Provider.
It is recommended to create a dedicated client for each service (e.g., one for REMS, one for Storage, and one for the website).

To register a service, you need to visit this [link](https://services.aai.lifescience-ri.eu/spreg/auth), go to "New Service" and fill the required fields. For reference, below you'll find a list of the common fields among all the services.

When this is done, LS AAI will review your request and provide you with a client ID and a client secret that you'll need to use in the configuration of each service.

#### Common fields
- Authentication protocol: OIDC
- Login URL: The URL of the product (*e.g.*, https://rems.gdi.biodata.pt)
- Flows the service will use: authorization code
- Token endpoint authentication type: client_secret_basic
- PKCE type: SHA256 code challenge
- Issue refresh tokens for this client: No
- Step 3 of the registration: Component-specific fields (see below)
- Step 4 of the registration: No need to check or fill anything

#### Component-specific fields

##### S&I
- Scopes: openid, profile, email, ga4gh_passport_v1, eduperson_entitlement  
- Redirect URIs: 
    - Base url of storage domain + */oidc/login* (e.g., https://login.tre.biodata.pt/oidc/login )
    - Base url of website API domain + */oidc-callback* (e.g., https://website-api.tre.biodata.pt/oidc-callback)

##### REMS
- Scopes: openid, profile, email, ga4gh_passport_v1
- Redirect URIs: base url + */oidc-callback* (*e.g.*, https://rems.tre.biodata.pt/oidc-callback)

### Connection LS AAI -> REMS

When using LS AAI as the OIDC provider, you will now need that LS AAI gets the existing entitlements (permissions) of a user in your REMS instance during login, otherwise it will end up not working. To do that, you need to provide LS AAI people with the credentials of the reporter user that you created in REMS during the first start-up, or use the script at _./gdi-core/rems/scripts/create-reporter-user.sh_ to create separate credentials for it (remember to use a different API key and username!). There is no official channel for that, so you need to contact the LS AAI people directly and ask them to set up the connection between LS AAI and your REMS instance.

If you want to test if the credentials for the reporter user are right (_e.g._, before sending them to the LS AAI people), do `make try-reporter-creds` while having the env variables _REPORTER_API_KEY_ and _REPORTER_USER_ setup to the credentials to intend to use. If the command returns "forbidden" or "unauthorized", there is something wrong that must be fixed.

#### How to change credentials
You might want to change your credentials later, specially when going from test to production. If you do, here's what you need to change:

- User API keys: Directly on the DB, use `make psql` and look for the _api\_key_, _users_, and _roles_ tables. You may also use `make clean-rems-roles` to delete every role assignment and api key, and then run `make create-rems-roles` to create new ones based on the current configuration in _.env_.

### Funnel

- Change the values in Funnel configuration using `vim gdi-core/funnel-sk/config/config.yaml` to match the public URL and the S3 endpoint credentials
- You may want to change the S3 server used by Funnel. In that case, edit _vim gdi-core/funnel-sk/config/config.yaml_. Otherwise, it will use the _s3_ container in the storage component (already included in the deployment)
- For the time being, this service is only available internally because of other services that depend on it, but that might change in the future.

### Storage & Interfaces
- If you want to change the S3 server used by the TRE to store data and distribute it to Funnel, you can change the S3 configuration in _.env_ ("INTERNAL GDI CORE STORAGE" in the template from _.env.example_). Otherwise, it will use the _s3_ container in the storage component (already included in the deployment).
- You might need to change the OIDC configuration URL as well as the trusted Visa issuers(config/iss.json) when transitioning from test environment to prod, but only if you change the OIDC provider (i.e., LS AAI or some mock) and/or the REMS instance used for issuing Visas. That is highly dependent on your specific setup, so there is no general rule for that. However, the _.env_ template is already prepared for the transition from a local Mock AAI to LS AAI, so you can use it as a reference.