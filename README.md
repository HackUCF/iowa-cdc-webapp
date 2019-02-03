# Iowa CDC 2019 - Webapp

This repository contains the web application provided to us by ISU for [ISEAGE 2019](https://www.iseage.org). 

From its initial version, a great deal of security improvements have been made, including:
- Removal of a great deal of pre-planted vulnerabilities and malware
- JWT token support for sessions
- Hashed passwords using bcrypt (with an additional salt)
- Increased security requirements implemented on upstream services
- Recaptcha support (with challenges appearing on the login page after several subsequent failed login attempts)

Note that this application is not what you'd call "production-ready", in the sense that it's not something you'd throw up on a public site of any kind. Rather, the security improvements listed above were implemented for a one-off competition event, and meant to weather an onslaught of attacks from red team only for the duration of the competition. If anything, this repository exists purely for our archives as a teaching aid.

## Invocation

The application accepts secrets (key material) in the form of environment variables, as below:

```
 CAPTCHA_SITE='your recaptcha site key' CAPTCHA_SECRET='your recaptcha secret key' B2N_SERVICE_PATH='/some-secret-path' B2N_SERVICE_AUTH='username:password' JWT_SIGNING_KEY='some key' PASSWORD_SALT='some password salt' NO_PROXY='*' pm2 start ecosystem.json
```
