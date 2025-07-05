export interface Castle {
  id: number;
  name: string;
  theme: string;
  size: string;
  price: number;
  description: string;
  imageUrl: string;
}

export const castles: Castle[] = [
  {
    id: 1,
    name: "The Classic Fun",
    theme: "Classic",
    size: "12ft x 15ft",
    price: 60,
    description: "A timeless classic, perfect for any party or event. Bright, colorful, and guaranteed to bring smiles.",
    imageUrl: "/bouncy-castle-1.jpg",
  },
  {
    id: 2,
    name: "Princess Palace",
    theme: "Princess",
    size: "15ft x 15ft",
    price: 75,
    description: "A magical castle for your little princess. Features beautiful artwork of enchanting characters.",
    imageUrl: "/bouncy-castle-2.jpg",
  },
  {
    id: 3,
    name: "Jungle Adventure",
    theme: "Jungle",
    size: "12ft x 18ft with slide",
    price: 80,
    description: "Go on a wild adventure! This castle includes a fun slide and is decorated with jungle animals.",
    imageUrl: "/bouncy-castle-3.jpg",
  },
  {
    id: 4,
    name: "Superhero Base",
    theme: "Superhero",
    size: "14ft x 14ft",
    price: 70,
    description: "Become a superhero for a day! This castle is perfect for action-packed parties.",
    imageUrl: "/bouncy-castle-4.jpg",
  },
  {
    id: 5,
    name: "Party Time Bouncer",
    theme: "Party",
    size: "10ft x 12ft",
    price: 55,
    description: "Ideal for smaller gardens, this compact bouncer is all about celebrating in style.",
    imageUrl: "/bouncy-castle-1.jpg", // using placeholder
  },
  {
    id: 6,
    name: "Under The Sea",
    theme: "Ocean",
    size: "15ft x 16ft",
    price: 75,
    description: "Dive into fun with our ocean-themed bouncy castle, complete with colorful sea creatures.",
    imageUrl: "/bouncy-castle-2.jpg", // using placeholder
  },
]; 