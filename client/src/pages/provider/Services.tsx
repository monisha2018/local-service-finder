import { useEffect, useState } from "react";
import { serviceService } from "../../services/serviceService";
import { Category, Service } from "../../types";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";

export default function ProviderServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ categoryId: "", name: "", description: "", price: "", durationMinutes: "60" });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [svcRes, catRes] = await Promise.all([serviceService.list({}), serviceService.categories()]);
      setServices(svcRes.data);
      setCategories(catRes.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await serviceService.create({
      categoryId: form.categoryId,
      name: form.name,
      description: form.description,
      price: Number(form.price),
      durationMinutes: Number(form.durationMinutes),
    });
    setModalOpen(false);
    setForm({ categoryId: "", name: "", description: "", price: "", durationMinutes: "60" });
    load();
  }

  async function handleDelete(id: string) {
    await serviceService.remove(id);
    load();
  }

  if (loading) return <LoadingState message="Loading your services..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">My Services</h1>
        <Button onClick={() => setModalOpen(true)}>Add Service</Button>
      </div>

      {services.length === 0 ? (
        <EmptyState title="No services yet" subtitle="Add your first service so customers can book you." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {services.map((s) => (
            <div key={s._id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-text-secondary">₹{s.price} · {s.durationMinutes} min</p>
              </div>
              <button onClick={() => handleDelete(s._id)} className="text-error text-sm font-semibold">Delete</button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add a Service">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Category</label>
            <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input-field">
              <option value="">Select category</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <Input label="Service Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Price (₹)" type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Input label="Duration (minutes)" type="number" required value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
          <Button type="submit" className="w-full">Create Service</Button>
        </form>
      </Modal>
    </div>
  );
}
