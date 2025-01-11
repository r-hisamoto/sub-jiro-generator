-- テストユーザーの作成
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz', now(), now(), now());

-- テストプロジェクトの作成
INSERT INTO public.projects (id, name, description, owner_id, created_at, updated_at, default_font_family, default_font_size, default_font_color)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Test Project', NULL, '00000000-0000-0000-0000-000000000001', '2025-01-11 05:02:40.219864+00', '2025-01-11 05:02:40.219864+00', 'Arial', 20, '#FFFFFF'); 