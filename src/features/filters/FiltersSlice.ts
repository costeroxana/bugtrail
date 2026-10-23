import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type StatusFilter = "All" | "Open" | "Resolved";

type FiltersState = {
  status: StatusFilter;
  search: string;
};

const initialState: FiltersState = {
  status: "All",
  search: "",
};

const filtersSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setStatusFilter(state, action: PayloadAction<StatusFilter>) {
      state.status = action.payload;
    },
    setSearch(state, action: PayloadAction<string>){
      state.search = action.payload;
    }
  },
});

export const { setStatusFilter, setSearch } = filtersSlice.actions;
export default filtersSlice.reducer;
