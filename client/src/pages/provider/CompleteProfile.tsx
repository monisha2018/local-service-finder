import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { serviceService } from "../../services/serviceService";
import { providerService } from "../../services/providerService";
import { Category } from "../../types";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import LoadingState from "../../components/ui/LoadingState";
import Icon from "../../components/ui/Icon";

const CHENNAI_AREAS = ["T Nagar", "Adyar", "Velachery", "Anna Nagar", "Mylapore", "Nungambakkam", "Porur", "Tambaram", "OMR / Sholinganallur", "Perambur"];
const LANGUAGE_OPTIONS = ["English", "Tamil", "Hindi", "Telugu", "Malayalam", "Kannada"];

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [profession, setProfession] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [languages, setLanguages] = useState<string[]>(["English", "Tamil"]);

  useEffect(() => {
    serviceService
      .categories()
      .then((r) => setCategories(r.data))
      .finally(() => setLoadingCategories(false));
  }, []);

  function toggleLanguage(lang: string) {
    setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await providerService.updateProfile({
        profession,
        categories: selectedCategory ? [selectedCategory] : [],
        bio,
        experienceYears: Number(experienceYears) || 0,
        serviceArea,
        languages,
      });
      navigate("/provider/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to save your profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingCategories) return <LoadingState message="Loading categories..." />;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-lg">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-md">
            <Icon name="engineering" className="text-on-primary text-[28px]" />
          </div>
          <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface mb-xs">Set Up Your Provider Profile</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Customers need this to find and trust you. You can update it anytime from Settings.
          </p>
        </div>

        {error && <p className="text-error text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <form onSubmit={handleSubmit} className="card space-y-4">
          <Input
            label="What work do you do? (e.g. Electrician, Plumber)"
            required
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            placeholder="Electrician"
          />

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Service Category</label>
            <select required value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="input-field">
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          <Input
            label="Years of Experience"
            type="number"
            min={0}
            required
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            placeholder="5"
          />

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Service Area</label>
            <select required value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} className="input-field">
              <option value="">Select your area</option>
              {CHENNAI_AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Languages Spoken</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                    languages.includes(lang) ? "bg-primary text-on-primary border-primary" : "border-outline-variant text-on-surface-variant"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Short Bio (optional)</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Tell customers a bit about your experience and what makes your service reliable."
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving..." : "Save & Continue to Dashboard"}
          </Button>
        </form>
      </div>
    </div>
  );
}