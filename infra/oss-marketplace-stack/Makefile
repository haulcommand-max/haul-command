.PHONY: up down logs ps health topics

up:
	docker compose up -d

down:
	docker compose down -v

logs:
	docker compose logs -f --tail=200

ps:
	docker compose ps

# Create default Haul Command topics in Redpanda
topics:
	docker exec hc-redpanda rpk topic create loads --partitions 3
	docker exec hc-redpanda rpk topic create risk --partitions 1
	docker exec hc-redpanda rpk topic create ops --partitions 3
	docker exec hc-redpanda rpk topic create payments --partitions 1
	docker exec hc-redpanda rpk topic create telemetry --partitions 3

# Health check all services
health:
	@echo "=== Redpanda ==="
	@docker exec hc-redpanda rpk cluster health 2>/dev/null || echo "DOWN"
	@echo "=== Redis ==="
	@docker exec hc-redis redis-cli ping 2>/dev/null || echo "DOWN"
	@echo "=== GrowthBook ==="
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3100 || echo "DOWN"
