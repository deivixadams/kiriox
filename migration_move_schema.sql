CREATE SCHEMA IF NOT EXISTS security;

ALTER TABLE corpus.security_rbac SET SCHEMA security;
ALTER TABLE corpus.security_user_scope SET SCHEMA security;
ALTER TABLE corpus.security_user_token SET SCHEMA security;
ALTER TABLE corpus.security_users SET SCHEMA security;
ALTER TABLE corpus.user_x_rbac SET SCHEMA security;
