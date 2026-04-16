# ResourceFlow

ResourceFlow is an advanced, interactive spatial resource management and reservation system. The application allows organizers to easily create and share interactive maps (such as concert hall layouts, office floor plans, or exhibition maps), while enabling users to seamlessly reserve and purchase specific spots in real-time.

The system is designed for high reliability and instant responsiveness, effectively eliminating common issues such as double bookings (overbooking).

---

## Tech Stack

### Frontend
* **React, TypeScript:**
* **Tailwind CSS, shadcn/ui:**
* **Vite**

### Backend
* **Django, Django REST Framework, Django Channels**
* **Celery, Redis**
* **PostgreSQL**
* **Docker**

---

## Getting Started (Docker Commands)

Use these commands to run the application.

### 1. Initial Setup and First Run
Builds images, starts services, runs migrations, and seeds initial data.

```bash
docker-compose --profile init up -d --build
```

### 2. Standard Startup
Starts the environment quickly without re-running initialization.

```bash
docker-compose up -d --build
```

### 3. Stop Services
Stops and removes containers.

```bash
docker-compose down
```

### 4. Full Reset
Stops services and permanently deletes all database volumes.

```bash
docker-compose down -v
```

---

## Functionalities

### Interactive Map Creator for Organizers
The core tool for event creators. Instead of working with static lists, organizers can visually design the layout of their space.

* **Custom Graphic Support:** Upload any image file (e.g., an architectural floor plan) to serve as the map background.
* **Drawing Tools:** Creators can manually place individual reservation points (units) directly onto the uploaded background.
* **Dynamic Grid System:** For large-scale spaces, the creator includes a grid generator. Organizers can quickly generate dozens or hundreds of units in perfect rows and columns, with adjustable spacing and rotation angles.
* **Editing and Updates:** Tools to modify existing maps, manage unit statuses (e.g., removing seats from sale), and adjust pricing.

### Real-Time Synchronization
The application ensures that what the user sees is always up to date.

* **WebSocket Technology:** Live connections ensure that every action taken by any user is immediately reflected on the screens of all others viewing the same map.
* **Dynamic Unit Statuses:** Points on the map change colors fluidly based on availability: Available, In Cart (selected by the current user), Reserved (pending payment by another user), or Purchased.
* **Conflict Prevention:** If two users attempt to click the same spot at the same time, the system (using database transaction locks) grants it to only one user and immediately updates the view for the other.

### Automated Reservation Cycle Management
The system ensures that reserved spots are not blocked indefinitely by undecided customers.

* **Payment Time Window:** After adding spots to the cart and initiating a reservation, the user is granted a temporary hold.
* **Background Jobs:** The system periodically scans the database for unpaid orders that have exceeded their time limit.
* **Automatic Resource Release:** Expired orders are marked accordingly, and the associated units automatically return to the "Available" pool, instantly updating the maps for all active users.

### Automated Financial Module and Payouts
ResourceFlow handles not just reservations, but the entire flow of funds.

* **Payment Processing:** Simulation of an integrated payment gateway (with an architecture ready for Stripe or PayPal integration).
* **Deadline Management:** Map creators can set a strict purchase deadline. Once reached, the map is automatically closed for new purchases.
* **Automated Payouts:** When the purchase deadline passes, background processes calculate the total revenue from all "Paid" orders and automatically generate a payout for the organizer to their provided bank account.

### User Dashboard
The application features a single, centralized dashboard that dynamically adjusts its functionalities based on the user's role and current needs, allowing for a seamless transition between organizing and participating.

* **Buyer Tools:** Integrated features to browse available resources, an intuitive map-based seat selection process, and access to a comprehensive order history with ticket details.
* **Creator Tools:** Advanced management features for creators to monitor live statistics (real-time revenue, units sold), view detailed order lists for each map, and track payout status for completed sales.
