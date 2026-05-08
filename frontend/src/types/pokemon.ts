export interface Pokemon {
  id: number
  pokedex_number: number
  name_fr: string
  sprite_url: string
  sprite_shiny_url: string | null
  cry_url: string | null
  types: string[]
  pokedex_description: string | null
  created_at: string
}
