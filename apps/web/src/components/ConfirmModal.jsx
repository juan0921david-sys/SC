export const ConfirmModal = ({ title, message, confirmText, onConfirm, onCancel, danger = false }) => {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div
                className="win-window modal-window modal-window-sm"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="win-titlebar">
                    <span>⚠️ {title}</span>
                    <div className="win-titlebar-controls">
                        <button className="win-titlebar-btn" onClick={onCancel}>
                            ✕
                        </button>
                    </div>
                </div>

                <div className="win-body">
                    <div style={{ padding: '20px 0', textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                            {danger ? '⚠️' : '❓'}
                        </div>
                        <p style={{ fontSize: '14px', marginBottom: '20px' }}>
                            {message}
                        </p>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={onCancel}
                            className="btn-retro"
                        >
                            ❌ Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`btn-retro ${danger ? 'btn-danger' : 'btn-success'}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};