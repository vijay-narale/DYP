import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log('Checking Supabase setup...');

  // Check schema
  const { error: schemaError } = await supabase.from('resumes').select('file_hash').limit(1);
  if (schemaError) {
    if (schemaError.code === 'PGRST204' || schemaError.message?.includes('column "file_hash" does not exist')) {
       console.log('❌ SCHEMA ERROR: column "file_hash" is missing in table "resumes". Please run the migration "002_v2_schema.sql" in Supabase SQL Editor.');
    } else {
       console.log('❌ SCHEMA ERROR:', schemaError.message || schemaError);
    }
  } else {
    console.log('✅ SCHEMA OK: column "file_hash" exists in table "resumes".');
  }

  // Check nickname column
  const { error: nickError } = await supabase.from('resumes').select('nickname').limit(1);
  if (nickError) {
    console.log('❌ SCHEMA ERROR: column "nickname" is missing. Run migration.');
  }

  // Check JD library domain/logo initials
  const { error: jdError } = await supabase.from('jd_library').select('domain, logo_initial').limit(1);
  if (jdError) {
    console.log('❌ SCHEMA ERROR: "jd_library" table is missing v2 columns. Run migration.');
  }

  // Check bucket
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.log('❌ BUCKET ERROR:', bucketError.message || bucketError);
  } else {
    const resumesBucket = buckets.find(b => b.name === 'resumes');
    if (!resumesBucket) {
      console.log('❌ BUCKET ERROR: "resumes" bucket is missing in Supabase storage. Please create a public bucket named "resumes".');
    } else {
      console.log('✅ BUCKET OK: "resumes" bucket exists.');
    }
  }
}
check();
