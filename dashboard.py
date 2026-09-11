import math
import random
import time
from datetime import datetime

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from ml_pipeline import ensure_model, predict_machine_status

st.set_page_config(
    page_title="Machine Health Monitoring Dashboard",
    page_icon="🏭",
    layout="wide",
)

SAFE_LIMITS = {
    "Temperature": 45.0,
    "Vibration": 700.0,
    "Load": 800.0,
    "RPM": 760.0,
}

CRITICAL_LIMITS = {
    "Temperature": 55.0,
    "Vibration": 850.0,
    "Load": 900.0,
    "RPM": 900.0,
}

UNITS = {
    "Temperature": "C",
    "Vibration": "mm/s",
    "Load": "A-load",
    "RPM": "RPM",
}


def init_state():
    if "sensor_values" not in st.session_state:
        st.session_state.sensor_values = {
            "Temperature": 25.7,
            "Vibration": 0.0,
            "Load": 95.0,
            "RPM": 560.0,
        }

    if "history" not in st.session_state:
        now = datetime.now()
        st.session_state.history = [
            {
                "timestamp": now,
                "Temperature": st.session_state.sensor_values["Temperature"],
                "Vibration": st.session_state.sensor_values["Vibration"],
                "Load": st.session_state.sensor_values["Load"],
                "RPM": st.session_state.sensor_values["RPM"],
            }
        ]


def apply_css():
    st.markdown(
        """
        <style>
            .stApp {
                background: radial-gradient(circle at 20% 5%, #ffffff 0%, #eef4fb 45%, #dfe8f3 100%);
                color: #1f2b36;
            }
            .machine-banner {
                padding: 1rem 1.2rem;
                border-radius: 14px;
                border: 1px solid #d5dde6;
                background: linear-gradient(130deg, #ffffff 0%, #f1f6fc 100%);
                box-shadow: 0 8px 24px rgba(30, 50, 70, 0.08);
                margin-bottom: 1rem;
            }
            .sensor-card {
                border: 1px solid #d5dde6;
                border-left: 6px solid #0f8f56;
                border-radius: 12px;
                background: #ffffff;
                padding: 0.9rem;
                box-shadow: 0 5px 14px rgba(0, 0, 0, 0.05);
            }
            .sensor-card.warn { border-left-color: #c28000; }
            .sensor-card.critical { border-left-color: #bf1f1f; }
            .status-box {
                border-radius: 12px;
                border: 1px solid #d5dde6;
                background: #ffffff;
                padding: 0.9rem;
            }
            .led {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                display: inline-block;
                margin-right: 8px;
                vertical-align: middle;
                border: 2px solid #7f8c99;
                background-color: #d0d7df;
            }
            .led.on {
                background-color: #d61c1c;
                border-color: #8e0e0e;
                box-shadow: 0 0 10px rgba(214, 28, 28, 0.85);
            }
        </style>
        """,
        unsafe_allow_html=True,
    )


def stream_controls():
    with st.sidebar:
        st.header("Industrial Input Simulator")
        st.caption("Power loom / Air-jet loom live sensor feed")

        auto_mode = st.toggle("Auto real-time stream", value=False)
        st.session_state.auto_stream_enabled = auto_mode
        if auto_mode:
            st.caption("Auto stream active: refreshing every 1 second")

        temperature = st.number_input("Temperature", 0.0, 200.0, value=st.session_state.sensor_values["Temperature"], step=0.1)
        vibration = st.number_input("Vibration", 0.0, 5000.0, value=st.session_state.sensor_values["Vibration"], step=1.0)
        load = st.number_input("Motor Load", 0.0, 5000.0, value=st.session_state.sensor_values["Load"], step=1.0)
        rpm = st.number_input("RPM", 0.0, 6000.0, value=st.session_state.sensor_values["RPM"], step=1.0)

        c1, c2 = st.columns(2)
        with c1:
            if st.button("Apply Reading", width="stretch"):
                st.session_state.sensor_values = {
                    "Temperature": float(temperature),
                    "Vibration": float(vibration),
                    "Load": float(load),
                    "RPM": float(rpm),
                }
                append_history()
                st.rerun()
        with c2:
            if st.button("Next Sample", width="stretch"):
                simulate_incoming_sample()
                append_history()
                st.rerun()

        p1, p2 = st.columns(2)
        with p1:
            if st.button("Healthy Example", width="stretch"):
                st.session_state.sensor_values = {
                    "Temperature": 33.0,
                    "Vibration": 220.0,
                    "Load": 360.0,
                    "RPM": 620.0,
                }
                append_history()
                st.rerun()
        with p2:
            if st.button("Critical Example", width="stretch"):
                st.session_state.sensor_values = {
                    "Temperature": 58.0,
                    "Vibration": 980.0,
                    "Load": 980.0,
                    "RPM": 940.0,
                }
                append_history()
                st.rerun()


def simulate_incoming_sample():
    current = st.session_state.sensor_values
    next_values = {
        "Temperature": max(0.0, current["Temperature"] + random.uniform(-0.8, 1.3)),
        "Vibration": max(0.0, current["Vibration"] + random.uniform(-35, 55)),
        "Load": max(0.0, current["Load"] + random.uniform(-25, 40)),
        "RPM": max(0.0, current["RPM"] + random.uniform(-18, 22)),
    }

    if random.random() < 0.08:
        mode = random.choice(["Temperature", "Vibration", "Load", "RPM"])
        spike = {
            "Temperature": random.uniform(6, 11),
            "Vibration": random.uniform(180, 320),
            "Load": random.uniform(130, 260),
            "RPM": random.uniform(80, 180),
        }
        next_values[mode] += spike[mode]

    st.session_state.sensor_values = next_values


def append_history():
    st.session_state.history.append(
        {
            "timestamp": datetime.now(),
            "Temperature": st.session_state.sensor_values["Temperature"],
            "Vibration": st.session_state.sensor_values["Vibration"],
            "Load": st.session_state.sensor_values["Load"],
            "RPM": st.session_state.sensor_values["RPM"],
        }
    )
    st.session_state.history = st.session_state.history[-120:]


def metric_state(name: str, value: float) -> str:
    if value >= CRITICAL_LIMITS[name]:
        return "critical"
    if value >= SAFE_LIMITS[name]:
        return "warning"
    return "healthy"


def evaluate_status(values, ml_status):
    states = {name: metric_state(name, values[name]) for name in SAFE_LIMITS}
    any_critical = any(s == "critical" for s in states.values())
    any_warning = any(s == "warning" for s in states.values())

    if any_critical or ml_status == "Critical":
        overall = "Critical"
    elif any_warning or ml_status == "Warning":
        overall = "Warning"
    else:
        overall = "Healthy"

    return overall, states


def render_title():
    st.markdown(
        """
        <div class='machine-banner'>
            <h1 style='margin:0;'>Machine Health Monitoring Dashboard</h1>
            <p style='margin:0.4rem 0 0 0; color:#425262; font-size:1.05rem;'>Power Loom / Air-Jet Loom Industrial Monitoring</p>
        </div>
        """,
        unsafe_allow_html=True,
    )


def sensor_card(name, value):
    state = metric_state(name, value)
    card_class = "sensor-card"
    state_text = "Within Range"
    state_color = "#0f8f56"
    if state == "warning":
        card_class = "sensor-card warn"
        state_text = "Warning Range"
        state_color = "#c28000"
    elif state == "critical":
        card_class = "sensor-card critical"
        state_text = "Critical Range"
        state_color = "#bf1f1f"

    unit = UNITS[name]
    st.markdown(
        f"""
        <div class='{card_class}'>
            <h4 style='margin:0 0 0.25rem 0;'>{name}</h4>
            <div style='font-size:1.5rem; font-weight:700; margin:0.2rem 0;'>{value:.1f}{unit}</div>
            <div style='color:#51606f;'>Warning >= {SAFE_LIMITS[name]:.0f}{unit} | Critical >= {CRITICAL_LIMITS[name]:.0f}{unit}</div>
            <div style='color:{state_color}; font-weight:600; margin-top:0.35rem;'>{state_text}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_cards(values):
    st.subheader("Real-Time Sensor Monitoring")
    c1, c2, c3, c4 = st.columns(4)
    with c1:
        sensor_card("Temperature", values["Temperature"])
    with c2:
        sensor_card("Vibration", values["Vibration"])
    with c3:
        sensor_card("Load", values["Load"])
    with c4:
        sensor_card("RPM", values["RPM"])


def render_status_and_led(overall_status):
    left, right = st.columns([1.4, 1])

    with left:
        st.subheader("Machine Health Detection")
        if overall_status == "Critical":
            st.error("Machine Status: Critical")
        elif overall_status == "Warning":
            st.warning("Machine Status: Warning")
        else:
            st.success("Machine Status: Healthy")

        st.markdown("Warning thresholds: Temperature >= 45, Vibration >= 700, Motor Load >= 800, RPM >= 760")
        st.markdown("Critical thresholds: Temperature >= 55, Vibration >= 850, Motor Load >= 900, RPM >= 900")

    with right:
        st.subheader("Red LED Fault Indicator")
        led_on = overall_status == "Critical"
        led_class = "led on" if led_on else "led"
        led_state = "ON" if led_on else "OFF"
        led_note = "Critical Fault Detected" if led_on else "No Critical Fault"
        st.markdown(
            f"""
            <div class='status-box'>
                <div style='font-size:1.1rem; margin-bottom:0.5rem;'><span class='{led_class}'></span> Red LED: <b>{led_state}</b></div>
                <div style='color:#4f5f6f;'>{led_note}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )


def render_alerts(values):
    st.subheader("Fault Detection Alerts")
    alerts = []
    if values["Vibration"] >= SAFE_LIMITS["Vibration"]:
        level_txt = "Critical" if values["Vibration"] >= CRITICAL_LIMITS["Vibration"] else "Warning"
        alerts.append(f"{level_txt}: High vibration indicates possible bearing or shaft issue.")
    if values["Temperature"] >= SAFE_LIMITS["Temperature"]:
        level_txt = "Critical" if values["Temperature"] >= CRITICAL_LIMITS["Temperature"] else "Warning"
        alerts.append(f"{level_txt}: High temperature indicates overheating risk.")
    if values["Load"] >= SAFE_LIMITS["Load"]:
        level_txt = "Critical" if values["Load"] >= CRITICAL_LIMITS["Load"] else "Warning"
        alerts.append(f"{level_txt}: Abnormal motor load indicates mechanical resistance.")
    if values["RPM"] >= SAFE_LIMITS["RPM"]:
        level_txt = "Critical" if values["RPM"] >= CRITICAL_LIMITS["RPM"] else "Warning"
        alerts.append(f"{level_txt}: RPM fluctuation indicates operational instability.")

    if not alerts:
        st.info("No active anomaly alerts.")
    else:
        for message in alerts:
            if message.startswith("Critical"):
                st.error(message)
            else:
                st.warning(message)


def build_trend_chart(df, field, color, warn, critical):
    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=df["timestamp"],
            y=df[field],
            mode="lines+markers",
            line=dict(color=color, width=2),
            marker=dict(size=4),
            name=field,
        )
    )
    fig.add_hline(y=warn, line_dash="dash", line_color="#c28000", annotation_text="Warning")
    fig.add_hline(y=critical, line_dash="dash", line_color="#bf1f1f", annotation_text="Critical")
    fig.update_layout(
        height=260,
        margin=dict(l=8, r=8, t=20, b=10),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="#ffffff",
    font=dict(color="#2a3642"),
        xaxis_title="Time",
        yaxis_title=field,
    )
    return fig


def build_ecg_chart(df):
    signal = []
    for i, row in enumerate(df.tail(120).itertuples(index=False)):
        phase = i / 2.7
        vib_norm = min(1.5, getattr(row, "Vibration") / CRITICAL_LIMITS["Vibration"])
        load_norm = min(1.5, getattr(row, "Load") / CRITICAL_LIMITS["Load"])
        rpm_norm = min(1.5, getattr(row, "RPM") / CRITICAL_LIMITS["RPM"])
        spike = math.sin(phase * 4.2) * (0.65 if vib_norm > 0.9 else 0.2)
        waveform = math.sin(phase) * 0.4 + spike + load_norm * 0.35 + (rpm_norm - 0.6) * 0.45
        signal.append(waveform)

    fig = go.Figure(
        go.Scatter(
            x=list(range(len(signal))),
            y=signal,
            mode="lines",
            line=dict(color="#00b4d8", width=2),
            name="ECG Waveform",
        )
    )
    fig.update_layout(
        height=230,
        margin=dict(l=8, r=8, t=20, b=10),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="#ecfeff",
        font=dict(color="#1e293b"),
        xaxis_title="Live Sample",
        yaxis_title="Waveform",
    )
    return fig


def render_visuals():
    st.subheader("Real-Time Waveform and Live Trend Graphs")
    df = pd.DataFrame(st.session_state.history)

    st.plotly_chart(build_ecg_chart(df), width="stretch")

    r1c1, r1c2 = st.columns(2)
    with r1c1:
        st.plotly_chart(build_trend_chart(df, "Temperature", "#ef4444", SAFE_LIMITS["Temperature"], CRITICAL_LIMITS["Temperature"]), width="stretch")
    with r1c2:
        st.plotly_chart(build_trend_chart(df, "Vibration", "#f97316", SAFE_LIMITS["Vibration"], CRITICAL_LIMITS["Vibration"]), width="stretch")

    r2c1, r2c2 = st.columns(2)
    with r2c1:
        st.plotly_chart(build_trend_chart(df, "Load", "#22c55e", SAFE_LIMITS["Load"], CRITICAL_LIMITS["Load"]), width="stretch")
    with r2c2:
        st.plotly_chart(build_trend_chart(df, "RPM", "#38bdf8", SAFE_LIMITS["RPM"], CRITICAL_LIMITS["RPM"]), width="stretch")


def main():
    init_state()
    apply_css()
    stream_controls()

    model = ensure_model("rapier_model.pkl", "machine_health_data.csv")

    values = st.session_state.sensor_values
    ml_status = predict_machine_status(
        temperature=values["Temperature"],
        vibration=values["Vibration"],
        load=values["Load"],
        rpm=values["RPM"],
        model=model,
    )

    overall_status, _states = evaluate_status(values, ml_status)

    render_title()
    render_cards(values)
    render_status_and_led(overall_status)
    render_alerts(values)
    render_visuals()

    if st.session_state.get("auto_stream_enabled", False):
        time.sleep(1)
        simulate_incoming_sample()
        append_history()
        st.rerun()


if __name__ == "__main__":
    main()
