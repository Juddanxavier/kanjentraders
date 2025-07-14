# 🔐 Environment Variables Security Guide

## 🚨 **CRITICAL SECURITY REQUIREMENTS**

### **Never Commit These Files**
- ❌ `.env` - Should NEVER be committed to version control
- ❌ `.env.local` - Contains your actual credentials
- ❌ `.env.production` - Contains production secrets
- ✅ `.env.example` - Safe to commit (contains no real credentials)

## 📁 **File Structure**

```
project/
├── .env.example          # ✅ Template file (safe to commit)
├── .env.local           # ❌ Your actual dev credentials (DO NOT COMMIT)
├── .env.production      # ❌ Production credentials (DO NOT COMMIT)
└── .gitignore           # ✅ Must include .env* patterns
```

## 🛠️ **Setup Instructions**

### **For Development**
1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your actual credentials in `.env.local`:
   ```bash
   # Generate a secure secret
   openssl rand -base64 32
   
   # Use it in your .env.local
   BETTER_AUTH_SECRET=your_generated_secret_here
   ```

3. **Never commit `.env.local`** - it's already in `.gitignore`

### **For Production**
1. Set environment variables directly in your hosting platform:
   - **Vercel**: Project Settings → Environment Variables
   - **Netlify**: Site Settings → Environment Variables  
   - **Railway**: Project Settings → Variables
   - **Docker**: Use docker-compose or Kubernetes secrets

2. **Required Production Variables**:
   ```bash
   BETTER_AUTH_SECRET=your_32_char_production_secret
   DATABASE_URL=postgresql://prod_credentials
   BETTER_AUTH_URL=https://yourdomain.com
   NODE_ENV=production
   ```

## 🔒 **Security Best Practices**

### **1. Secret Generation**
```bash
# Generate secure secrets
openssl rand -base64 32              # For BETTER_AUTH_SECRET
openssl rand -hex 32                 # Alternative method
node -e "console.log(crypto.randomBytes(32).toString('hex'))"  # Node.js method
```

### **2. Database Security**
```bash
# Use SSL connections
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# For production, use connection pooling
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require&connection_limit=20
```

### **3. API Keys Protection**
- Use environment variables for ALL API keys
- Rotate secrets regularly
- Use different secrets for different environments
- Never log sensitive environment variables

### **4. Git Security**
```bash
# If you accidentally committed secrets, remove from history:
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all

# Force push to remove from remote
git push origin --force --all
```

## ⚠️ **Common Mistakes**

### **❌ What NOT to do:**
```bash
# DON'T commit .env files
git add .env

# DON'T hardcode secrets in code
const secret = "hardcoded_secret_123";

# DON'T use the same secret across environments
BETTER_AUTH_SECRET=same_secret_everywhere

# DON'T share secrets in plain text
# Slack: "Here's the database password: abc123"
```

### **✅ What TO do:**
```bash
# DO use environment variables
const secret = process.env.BETTER_AUTH_SECRET;

# DO use different secrets per environment
# dev: BETTER_AUTH_SECRET=dev_secret_32_chars
# prod: BETTER_AUTH_SECRET=prod_secret_32_chars

# DO use secure communication for sharing secrets
# Use password managers, encrypted channels, or secure vaults
```

## 🚨 **If Secrets Are Compromised**

### **Immediate Actions:**
1. **Rotate ALL compromised secrets immediately**
2. **Check git history** for exposed credentials
3. **Review access logs** for unauthorized usage
4. **Update all environments** with new secrets
5. **Monitor for suspicious activity**

### **Recovery Steps:**
```bash
# 1. Generate new secrets
NEW_SECRET=$(openssl rand -base64 32)

# 2. Update all environments
# - Update .env.local
# - Update production environment variables
# - Update any CI/CD pipelines

# 3. Test all systems with new secrets

# 4. Revoke old credentials at the source
# - Database passwords
# - API keys
# - Authentication tokens
```

## 📋 **Environment Checklist**

### **Before Deployment:**
- [ ] All `.env*` files are in `.gitignore`
- [ ] No hardcoded secrets in code
- [ ] Production secrets are different from development
- [ ] All secrets are at least 32 characters long
- [ ] Database connections use SSL
- [ ] Environment validation is working
- [ ] No secrets in logs or error messages

### **Regular Maintenance:**
- [ ] Rotate secrets every 90 days
- [ ] Review access logs monthly
- [ ] Audit environment variables quarterly
- [ ] Update dependencies regularly
- [ ] Monitor for security vulnerabilities

## 🔗 **Resources**

- [OWASP Secrets Management](https://owasp.org/www-community/vulnerabilities/Insufficient_Session-ID_Length)
- [GitHub Secrets Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Environment Variables Best Practices](https://12factor.net/config)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)

---

## 🆘 **Emergency Contact**

If you discover exposed secrets:
1. **Immediately** rotate the compromised credentials
2. **Document** what was exposed and when
3. **Report** to the security team
4. **Monitor** for any unauthorized access

**Remember: Security is everyone's responsibility!** 🛡️
