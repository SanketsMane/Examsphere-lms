# Update user role to admin in production
email="contactsanket1@gmail.com"
role="admin"

mysql -uroot -pRootPass123! -h localhost kidokool << EOF
UPDATE user SET role = '$role' WHERE email = '$email';
SELECT id, name, email, role FROM user WHERE email = '$email';
EOF
