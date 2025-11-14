-- ==========================================
-- 1️⃣ Users Table
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer','admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ==========================================
-- 2️⃣ Products Table
-- ==========================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    quantity INTEGER NOT NULL,
    remaining_items INTEGER NOT NULL,
    image_url TEXT,
    image_public_id TEXT NULL
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ==========================================
-- 3️⃣ Orders Table
-- ==========================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending','paid','shipped','completed','cancelled')),
    items JSONB NOT NULL,
    total_price DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ==========================================
-- 4️⃣ Trigger Functions
-- ==========================================

-- Function to calculate line_total and total_price
CREATE OR REPLACE FUNCTION calculate_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    item JSONB;
    new_items JSONB := '[]'::JSONB;
    total DECIMAL := 0;
BEGIN
    FOREACH item IN ARRAY (SELECT jsonb_array_elements(NEW.items)) LOOP
        -- Calculate line_total
        item := jsonb_set(item, '{line_total}', to_jsonb((item->>'price')::DECIMAL * (item->>'quantity')::INT));
        
        -- Add to total
        total := total + (item->>'line_total')::DECIMAL;
        
        -- Append item to new_items array
        new_items := new_items || jsonb_build_array(item);
    END LOOP;

    NEW.items := new_items;
    NEW.total_price := total;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrease remaining_items in products
CREATE OR REPLACE FUNCTION update_remaining_items()
RETURNS TRIGGER AS $$
DECLARE
    item JSONB;
    pid UUID;
    qty INT;
BEGIN
    FOREACH item IN ARRAY (SELECT jsonb_array_elements(NEW.items)) LOOP
        pid := (item->>'product_id')::UUID;
        qty := (item->>'quantity')::INT;

        -- Decrease remaining_items
        UPDATE products
        SET remaining_items = remaining_items - qty,
            updated_at = now()
        WHERE id = pid;

        -- Optional: Prevent negative remaining_items
        IF (SELECT remaining_items FROM products WHERE id = pid) < 0 THEN
            RAISE EXCEPTION 'Not enough stock for product %', pid;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 5️⃣ Triggers
-- ==========================================

-- Trigger to calculate line_total before insert
CREATE TRIGGER trg_calculate_order_totals
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION calculate_order_totals();

-- Trigger to decrease remaining_items before insert
CREATE TRIGGER trg_update_remaining_items
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION update_remaining_items();
