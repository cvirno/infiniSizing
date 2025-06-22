/*
  # Create Disk Options Table

  This migration creates a table to store disk options for vSAN configuration.

  1. Changes
    - Create disk_options table
    - Insert SSD and NVMe 2.5" disk options
    - Insert NL-SAS 3.5" disk options
*/

-- Create disk_options table
CREATE TABLE IF NOT EXISTS disk_options (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model text NOT NULL,
    capacity_gb integer NOT NULL,
    form_factor text NOT NULL,
    type text NOT NULL,
    interface text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE disk_options ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access on disk_options"
    ON disk_options
    FOR SELECT
    TO public
    USING (true);

-- Insert SSD and NVMe 2.5" disk options
INSERT INTO disk_options (model, capacity_gb, form_factor, type, interface) VALUES
    ('SSD 480GB', 480, '2.5', 'SSD', 'SAS'),
    ('SSD 960GB', 960, '2.5', 'SSD', 'SAS'),
    ('SSD 1.92TB', 1920, '2.5', 'SSD', 'SAS'),
    ('SSD 3.84TB', 3840, '2.5', 'SSD', 'SAS'),
    ('SSD 7.68TB', 7680, '2.5', 'SSD', 'SAS'),
    ('SSD 15.36TB', 15360, '2.5', 'SSD', 'SAS'),
    ('SSD 30.72TB', 30720, '2.5', 'SSD', 'SAS'),
    ('NVMe 480GB', 480, '2.5', 'NVMe', 'NVMe'),
    ('NVMe 960GB', 960, '2.5', 'NVMe', 'NVMe'),
    ('NVMe 1.92TB', 1920, '2.5', 'NVMe', 'NVMe'),
    ('NVMe 3.84TB', 3840, '2.5', 'NVMe', 'NVMe'),
    ('NVMe 7.68TB', 7680, '2.5', 'NVMe', 'NVMe'),
    ('NVMe 15.36TB', 15360, '2.5', 'NVMe', 'NVMe'),
    ('NVMe 30.72TB', 30720, '2.5', 'NVMe', 'NVMe');

-- Insert NL-SAS 3.5" disk options
INSERT INTO disk_options (model, capacity_gb, form_factor, type, interface) VALUES
    ('NL-SAS 1TB', 1024, '3.5', 'NL-SAS', 'SAS'),
    ('NL-SAS 2TB', 2048, '3.5', 'NL-SAS', 'SAS'),
    ('NL-SAS 4TB', 4096, '3.5', 'NL-SAS', 'SAS'),
    ('NL-SAS 6TB', 6144, '3.5', 'NL-SAS', 'SAS'),
    ('NL-SAS 8TB', 8192, '3.5', 'NL-SAS', 'SAS'),
    ('NL-SAS 10TB', 10240, '3.5', 'NL-SAS', 'SAS'),
    ('NL-SAS 12TB', 12288, '3.5', 'NL-SAS', 'SAS'),
    ('NL-SAS 16TB', 16384, '3.5', 'NL-SAS', 'SAS'),
    ('NL-SAS 18TB', 18432, '3.5', 'NL-SAS', 'SAS'),
    ('NL-SAS 20TB', 20480, '3.5', 'NL-SAS', 'SAS'),
    ('NL-SAS 22TB', 22528, '3.5', 'NL-SAS', 'SAS');

-- Create updated_at trigger
CREATE TRIGGER update_disk_options_updated_at
    BEFORE UPDATE ON disk_options
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 