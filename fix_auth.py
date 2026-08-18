import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """    // 2. Mock Unified Auth (Attempt Login -> Fallback to Register)
    console.log(`[MOCK DB] Executing Unified Auth for: ${syntheticEmail}`);
    
    // Log the user in, but keep the modal open so they can see their dashboard
    setGmName(rawInput);
  };"""

replace = """    // 2. Supabase Unified Auth (Attempt Login -> Fallback to Register)
    if (isSupabaseConfigured) {
      try {
        let { data, error } = await supabase.auth.signInWithPassword({
          email: syntheticEmail,
          password: password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            // Attempt Sign Up
            const signUpResponse = await supabase.auth.signUp({
              email: syntheticEmail,
              password: password,
              options: {
                data: {
                  gm_name: rawInput
                }
              }
            });

            if (signUpResponse.error) {
              if (signUpResponse.error.message.includes('User already registered') || signUpResponse.error.message.includes('already exists')) {
                 setAuthError("Incorrect password for this GM Handle.");
                 return;
              } else {
                 setAuthError(signUpResponse.error.message);
                 return;
              }
            }
            // Sign up successful
          } else {
            setAuthError(error.message);
            return;
          }
        }
        
        // Success
        setGmName(rawInput);
      } catch (err: any) {
        setAuthError(err.message || "Authentication failed.");
      }
    } else {
      // Fallback for local testing
      console.log(`[LOCAL] Executing Unified Auth for: ${syntheticEmail}`);
      setGmName(rawInput);
    }
  };"""

content = content.replace(target, replace)

signout_target = """                        <button
                          onClick={() => {
                            setGmName('');
                            setLoginInput('');
                            setPassword('');
                            setAuthMode('choose');
                          }}"""

signout_replace = """                        <button
                          onClick={async () => {
                            if (isSupabaseConfigured) {
                              await supabase.auth.signOut();
                            }
                            setGmName('');
                            setLoginInput('');
                            setPassword('');
                            setAuthMode('choose');
                          }}"""

content = content.replace(signout_target, signout_replace)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Applied real Auth!")
