import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter =
  url.startsWith("postgres://") || url.startsWith("postgresql://")
    ? new PrismaPg({ connectionString: url })
    : new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

// --- Helpers ---------------------------------------------------------------

const img = (seed: string, w = 600, h = 800) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;

const tags = (...t: string[]) => JSON.stringify(t);

const pick = <T>(arr: T[], i: number): T => arr[i % arr.length]!;

// --- Data ------------------------------------------------------------------

const BRANDS = [
  { name: "Atlas & Oak", slug: "atlas-oak" },
  { name: "Lumen", slug: "lumen" },
  { name: "Marée", slug: "maree" },
  { name: "North Field", slug: "north-field" },
  { name: "Sable", slug: "sable" },
  { name: "Verde Studio", slug: "verde-studio" },
  { name: "Kestrel", slug: "kestrel" },
  { name: "Maison Clay", slug: "maison-clay" },
  { name: "Drift", slug: "drift" },
  { name: "Powder Room", slug: "powder-room" },
];

type Category =
  | "tops"
  | "bottoms"
  | "outerwear"
  | "footwear"
  | "accessories"
  | "dresses";

const ITEM_NAMES: Record<Category, string[]> = {
  tops: [
    "Cotton Crewneck Tee",
    "Oxford Button-Down",
    "Ribbed Tank",
    "Linen Camp Shirt",
    "Boxy Knit Polo",
    "Striped Long-Sleeve",
    "Silk Blouse",
    "Waffle Henley",
  ],
  bottoms: [
    "Pleated Trousers",
    "Slim Denim",
    "Wide-Leg Jeans",
    "Tailored Chinos",
    "Cargo Pants",
    "Corduroy Pants",
    "Linen Shorts",
    "Pull-On Joggers",
  ],
  outerwear: [
    "Wool Overcoat",
    "Quilted Bomber",
    "Denim Trucker Jacket",
    "Belted Trench Coat",
    "Puffer Vest",
    "Suede Blazer",
    "Fleece Zip-Up",
    "Packable Rain Shell",
  ],
  footwear: [
    "Leather Loafers",
    "Canvas Sneakers",
    "Chelsea Boots",
    "Suede Derbies",
    "Mesh Running Trainers",
    "Strappy Sandals",
    "Hiking Boots",
    "Platform Mules",
  ],
  accessories: [
    "Woven Leather Belt",
    "Merino Beanie",
    "Canvas Tote",
    "Printed Silk Scarf",
    "Aviator Sunglasses",
    "Crossbody Bag",
    "Cotton Bucket Hat",
    "Leather Card Holder",
  ],
  dresses: [
    "Bias Slip Midi Dress",
    "Wrap Dress",
    "Pleated Maxi Dress",
    "Knit Sweater Dress",
    "Poplin Shirt Dress",
    "Tiered Sundress",
    "Ribbed Bodycon Mini",
    "Linen Smock Dress",
  ],
};

const CATEGORIES: Category[] = [
  "tops",
  "bottoms",
  "outerwear",
  "footwear",
  "accessories",
  "dresses",
];

const PRICE_RANGES: Record<Category, [number, number]> = {
  tops: [28, 120],
  bottoms: [45, 180],
  outerwear: [120, 480],
  footwear: [60, 320],
  accessories: [18, 160],
  dresses: [60, 260],
};

// Mirror the filterable colors (src/lib/constants COMMON_COLORS) so every
// color in the catalog filter actually has matching items.
const COLOR_POOL = [
  "black",
  "white",
  "gray",
  "beige",
  "brown",
  "red",
  "pink",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "navy",
  "cream",
  "denim",
];

function priceFor(cat: Category, n: number): number {
  const [min, max] = PRICE_RANGES[cat];
  const span = max - min;
  // Deterministic pseudo-spread, rounded to a tidy .99 ending.
  const base = min + ((n * 37) % span);
  return Math.floor(base) + 0.99;
}

async function main() {
  console.log("🌱 Seeding Wardrobe…");

  // Clear existing data (idempotent reseed), respecting FK order.
  await prisma.activityEvent.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.collectionItem.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.user.deleteMany();

  // --- Brands --------------------------------------------------------------
  const brands = await Promise.all(
    BRANDS.map((b) =>
      prisma.brand.create({
        data: {
          name: b.name,
          slug: b.slug,
          logoUrl: avatar(`brand-${b.slug}`),
          website: `https://example.com/${b.slug}`,
        },
      }),
    ),
  );
  console.log(`  • ${brands.length} brands`);

  // --- Users ---------------------------------------------------------------
  const DEMO_PASSWORD = "password123";
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const usersSeed = [
    {
      handle: "ava",
      name: "Ava Stone",
      email: "ava@wardrobe.test",
      bio: "Minimalist with a soft spot for great outerwear. Building the perfect capsule.",
    },
    {
      handle: "milo",
      name: "Milo Reyes",
      email: "milo@wardrobe.test",
      bio: "Streetwear, sneakers, and the occasional tailored moment.",
    },
    {
      handle: "nina",
      name: "Nina Park",
      email: "nina@wardrobe.test",
      bio: "Color, texture, and dresses for every season. ✦",
    },
  ];

  const users = await Promise.all(
    usersSeed.map((u) =>
      prisma.user.create({
        data: {
          handle: u.handle,
          name: u.name,
          email: u.email,
          bio: u.bio,
          avatarUrl: avatar(u.handle),
          passwordHash,
        },
      }),
    ),
  );
  const [ava, milo, nina] = users;
  console.log(`  • ${users.length} demo users (password: ${DEMO_PASSWORD})`);

  // --- Products ------------------------------------------------------------
  const products: { id: string; title: string; category: Category }[] = [];
  let pIndex = 0;
  for (const brand of brands) {
    for (let i = 0; i < 8; i++) {
      // Cycle through every category (offset per brand for variety).
      const category = pick(CATEGORIES, pIndex + brands.indexOf(brand));
      const name = pick(ITEM_NAMES[category], i);
      // Steps coprime to the pool length so all colors get coverage.
      const c1 = pick(COLOR_POOL, pIndex);
      const c2 = pick(COLOR_POOL, pIndex * 7 + 4);
      const colorTags = c1 === c2 ? tags(c1) : tags(c1, c2);
      const created = await prisma.product.create({
        data: {
          brandId: brand.id,
          title: `${brand.name} ${name}`,
          description: `A ${category} staple from ${brand.name}. ${c1[0]?.toUpperCase()}${c1.slice(1)} colorway.`,
          price: priceFor(category, pIndex),
          currency: "USD",
          imageUrl: img(`${brand.slug}-${i}`),
          sourceUrl: `https://example.com/${brand.slug}/p/${pIndex}`,
          category,
          colorTags,
          addedById: pIndex % 5 === 0 ? pick(users, pIndex).id : null,
        },
      });
      products.push({ id: created.id, title: created.title, category });
      pIndex++;
    }
  }
  console.log(`  • ${products.length} products`);

  // --- Collections + items -------------------------------------------------
  const activity: {
    actorId: string;
    verb: string;
    objectType: string;
    objectId: string;
    metadata: string;
    createdAt: Date;
  }[] = [];

  let dayOffset = 20;
  const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

  async function makeCollection(
    owner: (typeof users)[number],
    title: string,
    description: string,
    visibility: "public" | "friends" | "private",
    productPicks: typeof products,
  ) {
    const createdAt = daysAgo(dayOffset);
    dayOffset = Math.max(1, dayOffset - 2);
    const collection = await prisma.collection.create({
      data: {
        ownerId: owner.id,
        title,
        description,
        visibility,
        coverImageUrl: productPicks[0]
          ? img(`cover-${owner.handle}-${title.replace(/\s+/g, "-")}`)
          : null,
        createdAt,
        updatedAt: createdAt,
      },
    });
    activity.push({
      actorId: owner.id,
      verb: "created_collection",
      objectType: "collection",
      objectId: collection.id,
      metadata: JSON.stringify({ title, visibility }),
      createdAt,
    });

    for (let i = 0; i < productPicks.length; i++) {
      const p = productPicks[i]!;
      const addedAt = daysAgo(Math.max(0, dayOffset - 1));
      const item = await prisma.collectionItem.create({
        data: {
          collectionId: collection.id,
          productId: p.id,
          position: i,
          addedAt,
        },
      });
      if (visibility !== "private") {
        activity.push({
          actorId: owner.id,
          verb: "added_item",
          objectType: "collectionItem",
          objectId: item.id,
          metadata: JSON.stringify({
            collectionId: collection.id,
            collectionTitle: title,
            productTitle: p.title,
          }),
          createdAt: addedAt,
        });
      }
    }
    return collection;
  }

  const byCat = (cat: Category) => products.filter((p) => p.category === cat);

  const avaFall = await makeCollection(
    ava!,
    "Fall Capsule",
    "Earthy layers for the cooler months.",
    "public",
    [
      ...byCat("outerwear").slice(0, 3),
      ...byCat("bottoms").slice(0, 3),
      ...byCat("footwear").slice(0, 2),
    ],
  );
  await makeCollection(
    ava!,
    "Workwear Basics",
    "Clean, tailored pieces for the office.",
    "public",
    [...byCat("tops").slice(0, 4), ...byCat("bottoms").slice(3, 5)],
  );
  await makeCollection(
    ava!,
    "Someday Splurges",
    "The expensive dreams.",
    "private",
    [...byCat("outerwear").slice(5, 8)],
  );

  const miloKicks = await makeCollection(
    milo!,
    "Sneaker Rotation",
    "What's on feet this season.",
    "public",
    [...byCat("footwear").slice(2, 7), ...byCat("accessories").slice(0, 2)],
  );
  await makeCollection(
    milo!,
    "Street Layers",
    "Bombers, hoodies, and easy denim.",
    "public",
    [...byCat("outerwear").slice(1, 4), ...byCat("tops").slice(4, 7)],
  );

  const ninaDresses = await makeCollection(
    nina!,
    "Summer Dresses",
    "Sun's out. Breezy and bright.",
    "public",
    [...byCat("dresses").slice(0, 5), ...byCat("footwear").slice(5, 7)],
  );
  await makeCollection(
    nina!,
    "Accessories Wishlist",
    "Finishing touches.",
    "friends",
    [...byCat("accessories").slice(2, 7)],
  );

  console.log("  • collections + items");

  // --- Follows -------------------------------------------------------------
  const follows: [string, string][] = [
    [ava!.id, milo!.id],
    [ava!.id, nina!.id],
    [milo!.id, ava!.id],
    [milo!.id, nina!.id],
    [nina!.id, ava!.id],
  ];
  for (const [followerId, followingId] of follows) {
    await prisma.follow.create({ data: { followerId, followingId } });
    activity.push({
      actorId: followerId,
      verb: "followed",
      objectType: "user",
      objectId: followingId,
      metadata: JSON.stringify({
        followingHandle: users.find((u) => u.id === followingId)?.handle,
      }),
      createdAt: daysAgo(dayOffset + 3),
    });
  }
  console.log(`  • ${follows.length} follows`);

  // --- Likes + comments ----------------------------------------------------
  const likeTargets: {
    userId: string;
    targetType: string;
    targetId: string;
  }[] = [
    { userId: milo!.id, targetType: "collection", targetId: avaFall.id },
    { userId: nina!.id, targetType: "collection", targetId: avaFall.id },
    { userId: ava!.id, targetType: "collection", targetId: miloKicks.id },
    { userId: ava!.id, targetType: "collection", targetId: ninaDresses.id },
    { userId: nina!.id, targetType: "collection", targetId: miloKicks.id },
  ];
  for (const lt of likeTargets) {
    await prisma.like.create({ data: lt });
    activity.push({
      actorId: lt.userId,
      verb: "liked",
      objectType: lt.targetType,
      objectId: lt.targetId,
      metadata: "{}",
      createdAt: daysAgo(dayOffset + 1),
    });
  }

  const comments = [
    {
      userId: milo!.id,
      targetId: avaFall.id,
      body: "This palette is so good 🔥",
    },
    {
      userId: nina!.id,
      targetId: avaFall.id,
      body: "Stealing the trench, sorry not sorry.",
    },
    {
      userId: ava!.id,
      targetId: miloKicks.id,
      body: "Need those Chelsea boots.",
    },
  ];
  for (const c of comments) {
    await prisma.comment.create({
      data: {
        userId: c.userId,
        targetType: "collection",
        targetId: c.targetId,
        body: c.body,
      },
    });
    activity.push({
      actorId: c.userId,
      verb: "commented",
      objectType: "collection",
      objectId: c.targetId,
      metadata: JSON.stringify({ preview: c.body.slice(0, 60) }),
      createdAt: daysAgo(dayOffset),
    });
  }
  console.log(`  • ${likeTargets.length} likes, ${comments.length} comments`);

  // --- Activity events -----------------------------------------------------
  await prisma.activityEvent.createMany({ data: activity });
  console.log(`  • ${activity.length} activity events`);

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
