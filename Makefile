# Makefile

seed-centroids:
	python3 scripts/update_centroids.py

seed-exemplars:
	python3 manage.py seed_intent_exemplars

eval-router:
	python3 scripts/eval_router.py --corpus scripts/router_eval_corpus.json

runserver:
	python3 manage.py runserver

metrics:
	curl -sL http://127.0.0.1:8000/api/metrics/ | \
		grep -E "router_requests_total|router_uncertain_total|router_latency_seconds"

