.PHONY: pre-commit

pre-commit:
	poetry run python -m compileall -q app
	poetry run python -c "from app.main import CONFIG_PATH, load_config; load_config(CONFIG_PATH)"
