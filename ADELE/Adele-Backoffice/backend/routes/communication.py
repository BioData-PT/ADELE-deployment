import os
import requests
import json

def send_simple_message_templates(receiver_email: str, subject: str, template: str, variables: dict):
	print(f"Sending email to {receiver_email} with subject '{subject}' using template '{template}' and variables {variables}")
	return requests.post(
		os.getenv('MAILGUN_URI'),
		auth=("api", os.getenv('MAILGUN_API_KEY', 'MAILGUN_API_KEY')),
		data={"from": "Mailgun Sandbox <postmaster@sandbox9c29e10892be408da2611001fd406c3d.mailgun.org>",
			"to": receiver_email,
			"subject": subject,
			"template": template,
			"h:X-Mailgun-Variables": json.dumps(variables)})