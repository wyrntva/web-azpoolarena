# 📋 Production Deployment Checklist

Before deploying to production, make sure you've completed all these steps:

---

## 🔧 Pre-Deployment

### 1. VPS Setup
- [ ] VPS is running Ubuntu 20.04+ or Debian 11+
- [ ] At least 2GB RAM (4GB recommended)
- [ ] Docker is installed (`docker --version`)
- [ ] Docker Compose is installed (`docker compose version`)
- [ ] Firewall configured (ports 80, 443, 22)
- [ ] SSH key authentication enabled
- [ ] Non-root user with sudo privileges created

### 2. Domain Configuration
- [ ] Domain purchased and DNS configured
- [ ] A record for main domain points to VPS IP
- [ ] A record for www subdomain points to VPS IP
- [ ] A record for API subdomain points to VPS IP
- [ ] DNS propagation completed (check with `nslookup yourdomain.com`)

### 3. Project Setup
- [ ] Code is on GitHub/GitLab
- [ ] Repository cloned on VPS
- [ ] All sensitive files in `.gitignore`
- [ ] Latest code pulled (`git pull origin main`)

---

## 🔐 Security Configuration

### 4. Environment Variables (.env.prod)
- [ ] `.env.prod` created from `.env.prod.example`
- [ ] **POSTGRES_PASSWORD** changed to strong unique password (min 16 chars)
- [ ] **SECRET_KEY** changed to random 32+ character string
- [ ] **DOMAIN** set to your actual domain
- [ ] **API_DOMAIN** set to your API subdomain
- [ ] **SSL_EMAIL** set to valid email for Let's Encrypt
- [ ] **CORS_ORIGINS** includes your production domains
- [ ] **VITE_API_URL** points to your production API URL
- [ ] File permissions set correctly (`chmod 600 .env.prod`)

### 5. SSL Certificates
- [ ] Let's Encrypt certbot installed
- [ ] SSL certificates obtained (`./scripts/ssl-setup.sh`)
- [ ] Certificates copied to `nginx/ssl/`
- [ ] Certificate auto-renewal configured in crontab

### 6. Firewall
```bash
- [ ] UFW enabled
- [ ] Port 22 (SSH) allowed
- [ ] Port 80 (HTTP) allowed
- [ ] Port 443 (HTTPS) allowed
- [ ] All other ports blocked
```

---

## 🚀 Deployment

### 7. Initial Deployment
- [ ] Production images built successfully
- [ ] Database container started and healthy
- [ ] Backend container started and healthy
- [ ] Frontend container started and healthy
- [ ] Nginx container started and healthy
- [ ] Database migrations ran successfully
- [ ] Initial admin user created (if needed)

### 8. Testing
- [ ] Frontend accessible via HTTPS (`https://yourdomain.com`)
- [ ] API accessible via HTTPS (`https://api.yourdomain.com`)
- [ ] API documentation accessible (`https://api.yourdomain.com/docs`)
- [ ] Login functionality works
- [ ] CORS configured correctly (no errors in browser console)
- [ ] SSL certificate valid (green lock in browser)
- [ ] Health check endpoint works (`/health`)

### 9. Database
- [ ] Database connection working
- [ ] All tables created
- [ ] Sample/initial data loaded (if needed)
- [ ] Backup script tested
- [ ] Backup cron job configured

---

## 📊 Post-Deployment

### 10. Monitoring Setup
- [ ] Container health checks working
- [ ] Log rotation configured
- [ ] Disk space monitoring set up
- [ ] Backup verification scheduled
- [ ] Alert system configured (optional)

### 11. Performance
- [ ] Gzip compression enabled (check with browser dev tools)
- [ ] Static assets caching working
- [ ] Response times acceptable
- [ ] Memory usage within limits
- [ ] CPU usage normal

### 12. Documentation
- [ ] Deployment procedure documented
- [ ] Environment variables documented
- [ ] Rollback procedure documented
- [ ] Team members have access to documentation
- [ ] Backup/restore procedure documented

---

## 🔄 Maintenance Setup

### 13. Automated Tasks
- [ ] SSL certificate renewal cron job
```bash
# Add to crontab -e
0 3 * * * certbot renew --quiet && docker-compose -f docker-compose.prod.yml restart nginx
```

- [ ] Database backup cron job
```bash
# Daily backup at 2am
0 2 * * * cd /path/to/project && docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres azpoolarena > backups/backup-$(date +\%Y\%m\%d).sql
```

- [ ] Old backup cleanup
```bash
# Keep last 30 days of backups
0 4 * * * find /path/to/project/backups -name "backup-*.sql" -mtime +30 -delete
```

### 14. Update Procedure
- [ ] Update procedure tested in staging
- [ ] Zero-downtime deployment strategy planned
- [ ] Rollback procedure ready
- [ ] Team trained on update process

---

## ✅ Final Checks

### 15. Security Audit
- [ ] No sensitive data in Git history
- [ ] All default passwords changed
- [ ] Database not accessible from public internet
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] SQL injection protection (using ORMs)
- [ ] XSS protection enabled
- [ ] CSRF protection enabled (if needed)

### 16. Compliance
- [ ] Privacy policy updated (if applicable)
- [ ] Terms of service updated (if applicable)
- [ ] GDPR compliance checked (if EU users)
- [ ] Data retention policy defined

### 17. Team Handover
- [ ] Server access credentials shared securely
- [ ] Documentation shared with team
- [ ] Emergency contacts established
- [ ] On-call rotation scheduled (if applicable)

---

## 📞 Emergency Contacts

```
DevOps Lead:    _________________
Backend Dev:    _________________
Frontend Dev:   _________________
VPS Provider:   _________________
Domain Registrar: _______________
```

---

## 🆘 Emergency Procedures

### If Site is Down
1. Check container status: `docker-compose -f docker-compose.prod.yml ps`
2. Check logs: `docker-compose -f docker-compose.prod.yml logs -f`
3. Restart specific service: `docker-compose -f docker-compose.prod.yml restart [service]`
4. Full restart: `docker-compose -f docker-compose.prod.yml down && docker-compose -f docker-compose.prod.yml up -d`

### If Database Issues
1. Check database logs: `docker-compose -f docker-compose.prod.yml logs db`
2. Verify connection: `docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d azpoolarena -c "SELECT 1"`
3. Restore from backup if needed

### If SSL Certificate Expired
1. Renew: `certbot renew`
2. Copy to nginx: `cp /etc/letsencrypt/live/yourdomain.com/*.pem nginx/ssl/`
3. Restart nginx: `docker-compose -f docker-compose.prod.yml restart nginx`

---

## 📝 Sign-off

- [ ] All checklist items completed
- [ ] Deployment tested and verified
- [ ] Team briefed on new deployment
- [ ] Documentation updated

**Deployed by:** ___________________  
**Date:** ___________________  
**Version:** ___________________

---

**Keep this checklist for future deployments! 🚀**
