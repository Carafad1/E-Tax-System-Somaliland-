import { useEffect, useRef, useState } from "react";
import { Searchbar } from "react-native-paper";

export function SearchBar({ placeholder = "Search...", onSearch, debounceMs = 400 }) {
  const [query, setQuery] = useState("");
  const timerRef = useRef(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return undefined;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(query.trim());
    }, debounceMs);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  return (
    <Searchbar
      placeholder={placeholder}
      value={query}
      onChangeText={setQuery}
      style={{ marginBottom: 12, borderRadius: 10 }}
    />
  );
}
