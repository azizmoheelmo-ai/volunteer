import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiErrorMessage } from "../../api/client";
import { OPPORTUNITY_FIELDS, type OpportunityField } from "../../types";

export function CreateOpportunity() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [field, setField] = useState<OpportunityField>("اجتماعي");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [hours, setHours] = useState(1);
  const [maxVolunteers, setMaxVolunteers] = useState(10);
  const [targetGrades, setTargetGrades] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post("/opportunities", {
        title,
        description,
        field,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        hours,
        maxVolunteers,
        targetGrades: targetGrades
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean),
        status: "PUBLISHED",
      });
      navigate(`/teacher/opportunities/${res.data.opportunity.id}`);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">إنشاء فرصة تطوعية</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">اسم المبادرة</label>
          <input required className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="label">وصف المبادرة</label>
          <textarea
            required
            rows={3}
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="label">المجال</label>
          <select className="input" value={field} onChange={(e) => setField(e.target.value as OpportunityField)}>
            {OPPORTUNITY_FIELDS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">تاريخ ووقت البداية</label>
            <input
              type="datetime-local"
              required
              className="input"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
          </div>
          <div>
            <label className="label">تاريخ ووقت النهاية</label>
            <input
              type="datetime-local"
              required
              className="input"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">عدد الساعات التطوعية</label>
            <input
              type="number"
              min={0.5}
              step={0.5}
              required
              className="input"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">الحد الأقصى للمتطوعين</label>
            <input
              type="number"
              min={1}
              required
              className="input"
              value={maxVolunteers}
              onChange={(e) => setMaxVolunteers(Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <label className="label">الصفوف المستهدفة (اختياري، افصل بينها بفاصلة، اتركه فارغاً لجميع الصفوف)</label>
          <input
            className="input"
            placeholder="مثال: 2-1, 2-2"
            value={targetGrades}
            onChange={(e) => setTargetGrades(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "جارِ الإنشاء..." : "إنشاء ونشر الفرصة"}
        </button>
      </form>
    </div>
  );
}
