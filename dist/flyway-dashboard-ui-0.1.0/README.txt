Flyway Dashboard UI - Version 0.1.0
==================================================

This package contains the pre-built Flyway Dashboard web interface.

QUICK START
-----------

1. Configure Server Connection:
   Edit config.json and set the apiBaseUrl to your server:
   
   {
     "apiBaseUrl": "http://your-server:3001"
   }

2. Deploy to Web Server:

   IIS (Windows):
   - Copy all files to C:\inetpub\wwwroot\flyway-dashboard
   - web.config is already included for React Router support
   
   nginx (Linux):
   - Copy all files to /var/www/flyway-dashboard/
   - Configure nginx (see DEPLOYMENT_UI.md)
   
   Apache (Linux):
   - Copy all files to /var/www/flyway-dashboard/
   - .htaccess is already included for React Router support

3. Set Up HTTPS (Recommended):
   Use Let's Encrypt or your organization's SSL certificates

4. Open in Browser:
   Navigate to https://your-domain.com

CONFIGURATION
-------------

config.json:
  - apiBaseUrl: URL of your Flyway Dashboard server
  - Must match the server's ALLOWED_ORIGINS setting

web.config:
  - IIS configuration for React Router
  - Automatically included

.htaccess:
  - Apache configuration for React Router
  - Automatically included

TROUBLESHOOTING
---------------

UI Can't Connect to Server:
1. Check config.json has correct server URL
2. Verify server is running: curl http://server:3001/health
3. Check CORS settings on server (ALLOWED_ORIGINS)
4. Check browser console for detailed error messages

React Router Not Working:
- IIS: Ensure web.config is in the root directory
- Apache: Ensure .htaccess is in the root directory and mod_rewrite is enabled
- nginx: Configure try_files directive (see DEPLOYMENT_UI.md)

SUPPORT
-------

For detailed deployment instructions, see:
- Main README: https://github.com/your-org/flyway-dashboard
- UI Deployment Guide: DEPLOYMENT_UI.md
- Server Setup: DEPLOYMENT_SERVER.md

For issues or questions:
- GitHub Issues: https://github.com/your-org/flyway-dashboard/issues
