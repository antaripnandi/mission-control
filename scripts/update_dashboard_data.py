
import json
import datetime
import os

# Placeholder for OpenClaw's API calls - these would be actual tool calls in a real agent runtime
# For this script, we'll simulate their output.

def get_sessions_list():
    # In a real scenario, this would be: default_api.sessions_list(activeMinutes=60, messageLimit=1)
    return {
        "sessions": [
            {"sessionKey": "agent:main:main", "displayName": "Main Agent", "model": "litellm/gemini", "status": "active", "createdAt": "2026-03-11T23:00:00.000Z", "lastActivity": "2026-03-11T23:35:00.000Z", "totalTokens": 15000, "cost": 0.15, "lastMessages": [{"content": "Working on dashboard updates.", "timestamp": "2026-03-11T23:35:00.000Z"}]},
        ]
    }

def get_subagents_list():
    # In a real scenario, this would be: default_api.subagents(action="list")
    return {
        "subagents": [
            {"id": "subagent-123", "label": "Researcher", "model": "litellm/groq", "status": "running", "instruction": "Gathering interactive dashboard design ideas.", "spawnTime": "2026-03-11T23:28:45.000Z", "lastOutput": "Found several examples of responsive grids and agent cards."},
            {"id": "subagent-456", "label": "Coder", "model": "litellm/codex", "status": "completed", "instruction": "Implementing UI changes for planner card.", "spawnTime": "2026-03-11T23:30:00.000Z", "lastOutput": "Updated index.html successfully."}
        ]
    }

def get_cron_list():
    # In a real scenario, this would be: default_api.cron(action="list", includeDisabled=True)
    return {
        "jobs": [
            {"id": "cron-daily-heartbeat", "name": "Daily Heartbeat Check", "schedule": "every 24h", "enabled": True, "lastRun": "2026-03-11T00:00:00.000Z", "lastError": None},
            {"id": "cron-dashboard-update", "name": "Dashboard Update", "schedule": "every 5m", "enabled": True, "lastRun": "2026-03-11T23:30:00.000Z", "lastError": None},
        ]
    }

def update_dashboard_data():
    now = datetime.datetime.utcnow().isoformat(timespec='milliseconds') + 'Z'

    sessions_data = get_sessions_list()
    subagents_data = get_subagents_list()
    cron_jobs_data = get_cron_list()

    active_sessions = []
    total_tokens = 0
    total_cost = 0.0

    for s in sessions_data.get("sessions", []):
        last_message = s["lastMessages"][0]["content"] if s.get("lastMessages") else "No recent activity."
        active_sessions.append({
            "key": s["sessionKey"],
            "displayName": s["displayName"],
            "model": s["model"],
            "task": last_message,
            "status": s["status"],
            "startTime": s["createdAt"],
            "lastActivity": s["lastActivity"],
            "tokens": s["totalTokens"],
            "cost": f"${s['cost']:.2f}",
            "logs": [f"{datetime.datetime.fromisoformat(s['lastActivity'][:-1]).strftime('%H:%M:%S')} - {last_message}"] # Simplified log
        })
        total_tokens += s["totalTokens"]
        total_cost += s["cost"]

    subagents = []
    active_subagents_count = 0
    for sa in subagents_data.get("subagents", []):
        if sa["status"] == "running":
            active_subagents_count += 1
        subagents.append({
            "id": sa["id"],
            "label": sa["label"],
            "task": sa["instruction"],
            "model": sa["model"],
            "status": sa["status"],
            "startTime": sa["spawnTime"],
            "endTime": None if sa["status"] == "running" else now, # Placeholder
            "output": sa.get("lastOutput", ""),
            "logs": [f"{datetime.datetime.fromisoformat(sa['spawnTime'][:-1]).strftime('%H:%M:%S')} - Task started: {sa['instruction']}",
                     f"{datetime.datetime.fromisoformat(now[:-1]).strftime('%H:%M:%S')} - Status: {sa['status']}"] # Simplified logs
        })

    crons = []
    enabled_crons = 0
    paused_crons = 0
    error_crons = 0
    for c in cron_jobs_data.get("jobs", []):
        status = "ok" if c["enabled"] and not c["lastError"] else "paused" if not c["enabled"] else "error"
        if status == "ok":
            enabled_crons += 1
        elif status == "paused":
            paused_crons += 1
        elif status == "error":
            error_crons += 1

        crons.append({
            "name": c["name"],
            "schedule": c["schedule"],
            "status": status,
            "errors": 1 if c["lastError"] else 0, # Simplified
            "lastError": c["lastError"]
        })

    dashboard_data = {
        "lastUpdated": now,
        "connectionStatus": "polling",
        "actionRequired": [], # This would be populated based on specific alerts/conditions
        "stats": {
            "totalProducts": 2, # Hardcoded for now
            "activeCrons": enabled_crons,
            "pausedCrons": paused_crons,
            "errorCrons": error_crons,
            "activeSubagents": active_subagents_count,
            "totalTokens": total_tokens,
            "totalCost": f"${total_cost:.2f}"
        },
        "planner": {
            "currentGoal": "Improve Mission Control Dashboard",
            "lastAction": "Generated Python script for dashboard data updates.",
            "thoughtProcess": "Next, I need to execute this script and then set up a recurring cron job for it."
        },
        "activeSessions": active_sessions,
        "subagents": subagents,
        "products": [ # Hardcoded for now
            {"name": "OpenClaw Gateway", "url": "http://localhost:8080", "status": "live", "lastChecked": now},
            {"name": "ClawHub", "url": "https://clawhub.com", "status": "live", "lastChecked": now}
        ],
        "crons": crons,
        "recentActivity": [ # Placeholder, in a real system this would be a stream of events
            {"time": now, "event": "Dashboard data updated."},
            {"time": now, "event": "Python script executed for data generation."}
        ]
    }

    # Define the path to the dashboard-data.json file
    script_dir = os.path.dirname(__file__)
    data_file_path = os.path.join(script_dir, "..", "data", "dashboard-data.json")

    with open(data_file_path, "w") as f:
        json.dump(dashboard_data, f, indent=2)

    print(f"Dashboard data updated successfully at {data_file_path}")

if __name__ == "__main__":
    update_dashboard_data()
