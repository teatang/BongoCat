use gilrs::{EventType, Gilrs};
use serde::Serialize;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, Emitter, Runtime, command};

/// 是否正在监听手柄事件的标志
static IS_LISTENING: AtomicBool = AtomicBool::new(false);

/// 手柄事件类型枚举
#[derive(Debug, Clone, Serialize)]
pub enum GamepadEventKind {
    /// 按键变化
    ButtonChanged,
    /// 摇杆轴变化
    AxisChanged,
}

/// 手柄事件结构体
#[derive(Debug, Clone, Serialize)]
pub struct GamepadEvent {
    kind: GamepadEventKind,
    name: String,
    value: f32,
}

/// 启动手柄监听命令
/// 监听游戏手柄的按键和摇杆事件并发送到前端
#[command]
pub async fn start_gamepad_listing<R: Runtime>(app_handle: AppHandle<R>) -> Result<(), String> {
    if IS_LISTENING.load(Ordering::SeqCst) {
        return Ok(());
    }

    IS_LISTENING.store(true, Ordering::SeqCst);

    let mut gilrs = Gilrs::new().map_err(|err| err.to_string())?;

    while IS_LISTENING.load(Ordering::SeqCst) {
        while let Some(event) = gilrs.next_event() {
            let gamepad_event = match event.event {
                EventType::ButtonChanged(button, value, ..) => GamepadEvent {
                    kind: GamepadEventKind::ButtonChanged,
                    name: format!("{:?}", button),
                    value,
                },
                EventType::AxisChanged(axis, value, ..) => GamepadEvent {
                    kind: GamepadEventKind::AxisChanged,
                    name: format!("{:?}", axis),
                    value,
                },
                _ => continue,
            };

            let _ = app_handle.emit("gamepad-changed", gamepad_event);
        }
    }

    Ok(())
}

/// 停止手柄监听命令
#[command]
pub async fn stop_gamepad_listing() {
    if !IS_LISTENING.load(Ordering::SeqCst) {
        return;
    }

    IS_LISTENING.store(false, Ordering::SeqCst);
}
