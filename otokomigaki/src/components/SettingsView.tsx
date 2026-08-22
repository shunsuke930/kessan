import { useRef, useState } from 'react'
import { STORAGE_KEY } from '../constants'
import { dateKey } from '../gameLogic'

export function SettingsView() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleExport = () => {
    const raw = localStorage.getItem(STORAGE_KEY) ?? '{}'
    const blob = new Blob([raw], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `otokomigaki-save-${dateKey(new Date())}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setMessage('データを書き出しました')
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result)
      try {
        JSON.parse(text)
      } catch {
        setMessage('JSONの形式が正しくありません')
        return
      }

      if (!window.confirm('現在のデータは上書きされます。読み込みますか？')) return

      localStorage.setItem(STORAGE_KEY, text)
      window.location.reload()
    }
    reader.readAsText(file)
  }

  return (
    <section className="min-h-0 flex-1 overflow-y-auto bg-slate-950 px-4 py-4">
      <h2 className="text-sm font-semibold text-slate-200">設定</h2>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="text-xs font-semibold text-slate-300">データのバックアップ</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          iOS Safariでは操作がないと数日でデータが消えることがあります。テスト中は定期的に書き出しておくと安心です。
        </p>

        <button
          type="button"
          onClick={handleExport}
          className="mt-3 w-full rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white active:bg-emerald-700"
        >
          データを書き出す
        </button>

        <button
          type="button"
          onClick={handleImportClick}
          className="mt-2 w-full rounded-full border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 active:bg-slate-800"
        >
          データを読み込む
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          className="hidden"
        />

        {message && <p className="mt-3 text-[11px] text-emerald-400">{message}</p>}
      </div>
    </section>
  )
}
