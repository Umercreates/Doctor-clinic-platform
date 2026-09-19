"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabPanel } from "@/components/dashboard/Tabs";
import { ContentBlockForm } from "./ContentBlockForm";
import { FaqManager } from "./FaqManager";
import { TestimonialManager } from "./TestimonialManager";

/**
 * /dashboard/content: one tab per website area plus FAQs and testimonials.
 * The active tab is mirrored to ?tab= so a refresh keeps the editor in place.
 */
export function ContentManager({ sections, faqs, testimonials, doctors, initialTab }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabs = [
    ...sections.map((s) => ({ id: s.id, label: s.label })),
    { id: "faqs", label: "FAQs", count: faqs.length },
    { id: "testimonials", label: "Testimonials", count: testimonials.length },
  ];
  const [tab, setTab] = useState(() => (tabs.some((t) => t.id === initialTab) ? initialTab : tabs[0].id));

  const changeTab = (next) => {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div>
      <Tabs tabs={tabs} value={tab} onChange={changeTab} />
      {sections.map((section) => (
        <TabPanel key={section.id} id={section.id} active={tab === section.id}>
          <div className="space-y-6">
            {section.blocks.map((block) => (
              <ContentBlockForm key={`${block.key}-${block.updatedAt || "default"}`} block={block} />
            ))}
          </div>
        </TabPanel>
      ))}
      <TabPanel id="faqs" active={tab === "faqs"}>
        <FaqManager faqs={faqs} />
      </TabPanel>
      <TabPanel id="testimonials" active={tab === "testimonials"}>
        <TestimonialManager testimonials={testimonials} doctors={doctors} />
      </TabPanel>
    </div>
  );
}
