export interface Property {
  id: number;
  name: string;
  type: "villa" | "hotel" | "apartment" | "house";
  location: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  gallery: string[];
  beds: number;
  baths: number;
  guests: number;
  area: string;
  amenities: string[];
  description: string;
  featured: boolean;
}

export const PROPERTIES: Property[] = [
  {
    id: 1,
    name: "Ocean Pearl Villa",
    type: "villa",
    location: "Bali, Indonesia",
    price: 450,
    rating: 4.9,
    reviews: 328,
    image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
    ],
    beds: 4,
    baths: 3,
    guests: 8,
    area: "350 m²",
    amenities: ["Infinity Pool", "Ocean View", "Private Chef", "Spa", "WiFi", "Gym"],
    description: "A stunning oceanfront villa with panoramic views of the Indian Ocean, featuring an infinity pool that seems to merge with the horizon. Perfect for luxury retreats and special celebrations.",
    featured: true,
  },
  {
    id: 2,
    name: "Alpine Luxe Chalet",
    type: "house",
    location: "Interlaken, Switzerland",
    price: 680,
    rating: 4.8,
    reviews: 214,
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80",
    ],
    beds: 5,
    baths: 4,
    guests: 10,
    area: "420 m²",
    amenities: ["Fireplace", "Mountain View", "Hot Tub", "Ski Access", "WiFi", "Wine Cellar"],
    description: "Nestled in the heart of the Swiss Alps, this luxurious chalet offers breathtaking mountain views, cozy fireplaces, and direct ski-in/ski-out access to world-class slopes.",
    featured: true,
  },
  {
    id: 3,
    name: "Skyline Penthouse",
    type: "apartment",
    location: "Dubai, UAE",
    price: 520,
    rating: 4.7,
    reviews: 189,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    ],
    beds: 3,
    baths: 2,
    guests: 6,
    area: "280 m²",
    amenities: ["City Skyline View", "Rooftop Pool", "Concierge", "Parking", "WiFi", "Gym"],
    description: "An ultra-modern penthouse with floor-to-ceiling windows offering spectacular views of the Dubai skyline. Features designer furnishings and a private rooftop terrace with pool.",
    featured: true,
  },
  {
    id: 4,
    name: "Tropical Garden Hotel",
    type: "hotel",
    location: "Phuket, Thailand",
    price: 180,
    rating: 4.6,
    reviews: 542,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    ],
    beds: 1,
    baths: 1,
    guests: 2,
    area: "45 m²",
    amenities: ["Pool", "Breakfast", "Spa", "Beach Access", "WiFi", "Restaurant"],
    description: "A serene boutique hotel surrounded by lush tropical gardens, offering a perfect blend of Thai hospitality and modern luxury just steps from pristine beaches.",
    featured: false,
  },
  {
    id: 5,
    name: "Malibu Beach House",
    type: "house",
    location: "California, USA",
    price: 750,
    rating: 4.9,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
    ],
    beds: 6,
    baths: 5,
    guests: 12,
    area: "550 m²",
    amenities: ["Beachfront", "Home Theater", "Hot Tub", "BBQ Area", "WiFi", "Garage"],
    description: "An iconic Malibu beach house with direct sand access, featuring contemporary architecture, open-plan living spaces, and breathtaking Pacific sunset views from every room.",
    featured: true,
  },
  {
    id: 6,
    name: "Santorini Cave Suite",
    type: "hotel",
    location: "Oia, Greece",
    price: 380,
    rating: 4.8,
    reviews: 423,
    image: "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800&q=80",
    ],
    beds: 2,
    baths: 2,
    guests: 4,
    area: "120 m²",
    amenities: ["Caldera View", "Plunge Pool", "Breakfast", "Sunset Terrace", "WiFi", "Bar"],
    description: "A stunning cave suite carved into the volcanic cliffs of Santorini, offering unobstructed views of the Caldera and legendary Oia sunsets from your private terrace.",
    featured: true,
  },
  {
    id: 7,
    name: "Tokyo Zen Apartment",
    type: "apartment",
    location: "Shibuya, Japan",
    price: 220,
    rating: 4.5,
    reviews: 298,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    ],
    beds: 2,
    baths: 1,
    guests: 4,
    area: "85 m²",
    amenities: ["City View", "Smart Home", "Kitchen", "Laundry", "WiFi", "Near Station"],
    description: "A minimalist Japanese-inspired apartment in the heart of Shibuya, blending traditional zen aesthetics with cutting-edge smart home technology and incredible city views.",
    featured: false,
  },
  {
    id: 8,
    name: "Tuscan Villa Estate",
    type: "villa",
    location: "Tuscany, Italy",
    price: 890,
    rating: 5.0,
    reviews: 97,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    ],
    beds: 8,
    baths: 6,
    guests: 16,
    area: "800 m²",
    amenities: ["Vineyard", "Pool", "Wine Tasting", "Private Garden", "WiFi", "Chef Service"],
    description: "A magnificent 16th-century Tuscan estate set among rolling vineyards and olive groves. Features a restored farmhouse with original stone walls, a private pool, and exclusive wine tasting experiences.",
    featured: true,
  },
];

export const TESTIMONIALS = [
  {
    id: 1,
    name: "Sarah Mitchell",
    role: "Travel Blogger",
    avatar: "SM",
    rating: 5,
    text: "LuxeStay transformed our anniversary trip into an unforgettable experience. The Ocean Pearl Villa in Bali was even more stunning than the photos. Impeccable service!",
  },
  {
    id: 2,
    name: "James Rodriguez",
    role: "Business Executive",
    avatar: "JR",
    rating: 5,
    text: "As someone who travels frequently for work, LuxeStay has become my go-to. The booking process is seamless, and every property exceeds expectations. Highly recommended.",
  },
  {
    id: 3,
    name: "Emily Chen",
    role: "Interior Designer",
    avatar: "EC",
    rating: 5,
    text: "The attention to detail in each property is remarkable. From the curated furnishings to the thoughtful amenities, LuxeStay truly understands luxury living.",
  },
  {
    id: 4,
    name: "Marco Bianchi",
    role: "Photographer",
    avatar: "MB",
    rating: 5,
    text: "I've stayed at dozens of luxury properties worldwide, and LuxeStay consistently delivers the most photogenic and comfortable accommodations. Pure excellence.",
  },
];
