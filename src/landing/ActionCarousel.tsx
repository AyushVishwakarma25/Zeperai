import React from 'react';

const items = [
  { id: 1, src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80" },
  { id: 2, src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80" },
  { id: 3, src: "https://images.unsplash.com/photo-1492288991661-058aa541ff43?w=600&q=80" },
  { id: 4, src: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=600&q=80" },
  { id: 5, src: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600&q=80" },
  { id: 6, src: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=80" },
  { id: 7, src: "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=600&q=80" },
  { id: 8, src: "https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=600&q=80" },
];

export const ActionCarousel: React.FC = () => {
  return (
    <section className="py-24 overflow-hidden bg-white">
      <div className="text-center mb-20 px-4 max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">See ZeperAi in Action</h2>
        <p className="text-xl text-slate-600 leading-relaxed">
          From high-converting product visuals that feel like they belong in the feed, to bold ad creatives designed to catch the eye.
        </p>
      </div>

      <div className="relative w-full h-[400px] md:h-[500px] flex justify-center items-center [perspective:1200px]">
        <div className="relative w-[220px] h-[320px] md:w-[300px] md:h-[420px] [transform-style:preserve-3d] animate-carousel-spin">
          {items.map((item, index) => {
            const rotateY = index * (360 / items.length);
            return (
              <div
                key={item.id}
                className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white"
                style={{
                  transform: `rotateY(${rotateY}deg) translateZ(clamp(280px, 40vw, 450px))`,
                }}
              >
                <img src={item.src} alt="Creative" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
