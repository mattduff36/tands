import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What areas do you deliver to?",
    answer:
      "We are based in Edwinstowe and offer free delivery within a 10-mile radius. We also deliver to locations between 10 and 20 miles away for a small £5 charge.",
  },
  {
    question: "Are the bouncy castles clean?",
    answer:
      "Absolutely! We clean and sanitize every bouncy castle before and after each hire to ensure a safe and hygienic environment for your event.",
  },
  {
    question: "What happens in case of bad weather?",
    answer:
      "For safety reasons, we cannot operate bouncy castles in heavy rain or high winds. If bad weather is forecast, we will contact you to discuss rescheduling or cancellation options. Your safety is our priority.",
  },
  {
    question: "How much space do I need?",
    answer:
      "You will need a clear, flat area of grass that is large enough to accommodate the bouncy castle with at least 2ft of clear space on all sides. The dimensions for each castle are listed on our 'Our Castles' page.",
  },
  {
    question: "Are you insured?",
    answer:
      "Yes, we are fully insured with Public Liability insurance. All of our castles are also PIPA tested to meet UK safety standards.",
  },
  {
    question: "How do I pay?",
    answer:
      "We accept cash on delivery or payment by credit/debit card on the day of the hire. Our team will have a card machine available for your convenience.",
  },
];

const FAQPage = () => {
  return (
    <div className="bg-gradient-faq py-12 pt-24 min-h-screen">
      <main className="container mx-auto">
        <div className="rounded-3xl border-4 border-purple-300 bg-white/40 p-6 shadow-2xl backdrop-blur-md">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-500 via-pink-400 to-yellow-400 bg-clip-text text-transparent sm:text-5xl drop-shadow-lg mb-6">
              ❓ Frequently Asked Questions
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-gray-800 font-bold bg-white/30 rounded-2xl p-4 shadow-md border-2 border-white/30">
              Have a question? We've got answers. If you can't find what you're looking for, feel free to contact us directly.
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="max-w-3xl mx-auto mt-4">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="rounded-2xl border-2 border-purple-200 bg-white/80 mb-4 shadow-lg transition-transform hover:scale-105"
                >
                  <AccordionTrigger className="text-lg text-left font-bold text-purple-700 px-4 py-3 whitespace-normal break-words">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-gray-700 bg-purple-50 rounded-b-2xl p-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FAQPage; 