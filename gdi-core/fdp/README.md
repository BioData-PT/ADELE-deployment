# Deploy
- Change the client URL and persistent URL in application.yaml to match the FDP's public URL

# Change credentials (**important!**)
- After starting up, you have to:

- Go to your FDP webpage (default localhost:8667)
- Log in using the default credentials (albert.einstein@example.com:password)
- Click on right top corner, go to users
- Remove "Nikola Tesla"
- Click "Edit profile" on Albert Einstein and change the password to something safe
- You will need to use that same password when you configuring the ADELE backend

## IMPORTANT: 
For the data upload from the frontend is MANDATORY that the user creates a catalog manually in the FDP, and updates the FIX_FDP_CATALOG_LINK in the ADELE projects (.env)
- 