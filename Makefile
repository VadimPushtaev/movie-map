.PHONY: pre-commit

pre-commit:
	poetry run python -m compileall -q app
	poetry run python -c "from app.main import CONFIG_PATH, load_config; load_config(CONFIG_PATH)"
	poetry run python -c "from app.main import create_app; html = create_app().test_client().get('/').get_data(as_text=True); forbidden = (\"There's Still Tomorrow\", 'Before Sunrise', 'italy-theres-still-tomorrow', 'us-before-sunrise', 'tt21800162', 'tt0112471'); leaked = [value for value in forbidden if value in html]; assert not leaked, leaked"
