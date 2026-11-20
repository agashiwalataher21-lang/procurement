# Bait Al Hadaf ERP - GitHub Push Script
git init
git checkout -B main
git config user.name "agashiwalataher21-lang"
git config user.email "agashiwalataher21@gmail.com"
git remote remove origin 2>$null
git remote add origin https://github.com/agashiwalataher21-lang/procurement.git
git add .
git commit -m "Complete multi-currency ERP hardening, accounting reconciliation, and transaction journal page"
git push -u origin main
Write-Host "Successfully pushed to https://github.com/agashiwalataher21-lang/procurement.git" -ForegroundColor Green
