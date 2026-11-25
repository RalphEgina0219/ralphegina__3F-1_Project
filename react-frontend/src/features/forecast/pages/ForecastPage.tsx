import { PageHeader } from '@/components/ui/PageHeader';
import ForecastSection from '../ForecastSection';

/** The machine-learning page: the demand forecast, how the model works and the soap to buy. */
export default function ForecastPage() {
  return (
    <>
      <PageHeader
        eyebrow="Machine learning"
        title="Demand forecast"
        subtitle="What the next 7 days will likely bring, learned from the last 8 weeks of orders"
        className="md:mb-6"
      />
      <section aria-label="Demand forecast" className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
        <ForecastSection />
      </section>
    </>
  );
}
