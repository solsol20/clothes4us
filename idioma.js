/* Clothes4Us - cambio de idioma (Español / English / Português).
   Traduce los textos que ya están en el sitio sin tocar el resto del código:
   recorre la página, cambia los textos conocidos y vigila lo que se agrega después.
   Lo que no está en la lista queda en español. Para agregar un texto, sumá una línea a TEXTOS. */
(function () {
  'use strict';
  var IDIOMAS = ['es', 'en', 'pt'];
  var NOMBRES = { es: 'Español', en: 'English', pt: 'Português' };

  // [español, inglés, portugués]
  var TEXTOS = [
    // ---- menú y encabezado ----
    ['Inicio', 'Home', 'Início'], ['Guardados', 'Saved', 'Salvos'], ['Chats', 'Chats', 'Conversas'], ['Carrito', 'Cart', 'Carrinho'],
    ['Mi Perfil', 'My Profile', 'Meu Perfil'], ['Donar', 'Donate', 'Doar'], ['Ayuda', 'Help', 'Ajuda'],
    ['Buscar', 'Search', 'Buscar'], ['Buscar buzos, pantalones, usuarios...', 'Search hoodies, pants, users...', 'Buscar moletons, calças, usuários...'],
    ['Buscar usuarios', 'Search users', 'Buscar usuários'], ['Buscar usuarios...', 'Search users...', 'Buscar usuários...'],
    ['Iniciar Sesión / Registrarse', 'Log in / Sign up', 'Entrar / Cadastrar-se'], ['Iniciar Sesión', 'Log in', 'Entrar'], ['Iniciar sesión', 'Log in', 'Entrar'],
    ['Iniciá sesión', 'Log in', 'Entre'], ['Cerrar sesión', 'Log out', 'Sair'], ['Salir', 'Log out', 'Sair'], ['Mi perfil', 'My profile', 'Meu perfil'], ['Logo', 'Logo', 'Logo'], ['Clothes4Us', 'Clothes4Us', 'Clothes4Us'],
    // ---- títulos de pestaña ----
    ['Feria Virtual & Social - Clothes4Us', 'Virtual & Social Fair - Clothes4Us', 'Feira Virtual & Social - Clothes4Us'],
    ['Ayuda - Clothes4Us', 'Help - Clothes4Us', 'Ajuda - Clothes4Us'], ['Carrito - Clothes4Us', 'Cart - Clothes4Us', 'Carrinho - Clothes4Us'],
    ['Chats - Clothes4Us', 'Chats - Clothes4Us', 'Conversas - Clothes4Us'], ['Crear cuenta - Clothes4Us', 'Sign up - Clothes4Us', 'Criar conta - Clothes4Us'],
    ['Donar - Clothes4Us', 'Donate - Clothes4Us', 'Doar - Clothes4Us'], ['Guardados - Clothes4Us', 'Saved - Clothes4Us', 'Salvos - Clothes4Us'],
    ['Iniciar sesión - Clothes4Us', 'Log in - Clothes4Us', 'Entrar - Clothes4Us'], ['Mi Perfil - Clothes4Us', 'My Profile - Clothes4Us', 'Meu Perfil - Clothes4Us'],
    ['Nueva contraseña - Clothes4Us', 'New password - Clothes4Us', 'Nova senha - Clothes4Us'],
    ['Recuperar contraseña - Clothes4Us', 'Recover password - Clothes4Us', 'Recuperar senha - Clothes4Us'],
    // ---- inicio / publicar ----
    ['Filtros de Búsqueda', 'Search Filters', 'Filtros de Busca'], ['Precio entre (ARS):', 'Price between (ARS):', 'Preço entre (ARS):'],
    ['Min', 'Min', 'Mín'], ['Max', 'Max', 'Máx'], ['Precio máximo', 'Maximum price', 'Preço máximo'],
    ['Categorías:', 'Categories:', 'Categorias:'], ['Ropa', 'Clothing', 'Roupas'], ['Muebles', 'Furniture', 'Móveis'], ['Música', 'Music', 'Música'],
    ['Anuncios y ferias', 'Announcements & fairs', 'Anúncios e feiras'], ['Anuncio', 'Announcement', 'Anúncio'],
    ['Anuncio / Feria presencial (sin precio)', 'Announcement / In-person fair (no price)', 'Anúncio / Feira presencial (sem preço)'],
    ['Tipo de oferta:', 'Offer type:', 'Tipo de oferta:'], ['Solo Trueque ($0)', 'Swap only ($0)', 'Somente troca ($0)'], ['Trueque ($0)', 'Swap ($0)', 'Troca ($0)'],
    ['Aplicar Filtros', 'Apply Filters', 'Aplicar Filtros'],
    ['¿Qué querés publicar? Una prenda, un trueque o un anuncio', 'What do you want to post? An item, a swap or an announcement', 'O que você quer publicar? Uma peça, uma troca ou um anúncio'],
    ['¿Qué querés vender o intercambiar hoy?', 'What do you want to sell or swap today?', 'O que você quer vender ou trocar hoje?'],
    ['Título (ej: Campera Puffer talle L)', 'Title (e.g. Puffer jacket size L)', 'Título (ex: Jaqueta puffer tamanho G)'],
    ['Título de la publicación', 'Post title', 'Título da publicação'], ['Descripción', 'Description', 'Descrição'], ['Descripción:', 'Description:', 'Descrição:'],
    ['Contanos qué tenés, estado, talle o si buscás trueque...', 'Tell us what you have, its condition, size or if you want a swap...', 'Conte o que você tem, o estado, o tamanho ou se quer troca...'],
    ['Contá de qué se trata: fecha, hora, lugar (ej: Feria en Plaza Italia, sábado 10 a 18 hs)…', 'Tell us what it is about: date, time, place (e.g. Fair at Plaza Italia, Saturday 10 am to 6 pm)…', 'Conte do que se trata: data, hora, local (ex: Feira na Praça Itália, sábado das 10 às 18 h)…'],
    ['Precio ARS ($0 trueque)', 'Price ARS ($0 swap)', 'Preço ARS ($0 troca)'], ['Precio en pesos', 'Price in pesos', 'Preço em pesos'], ['Categoría', 'Category', 'Categoria'],
    ['Foto (opcional):', 'Photo (optional):', 'Foto (opcional):'], ['Vista previa de la foto', 'Photo preview', 'Pré-visualização da foto'],
    ['Publicar en el Muro', 'Post on the Wall', 'Publicar no Mural'], ['Publicar en la Feria', 'Post at the Fair', 'Publicar na Feira'], ['Publicar anuncio', 'Post announcement', 'Publicar anúncio'],
    ['Iniciá sesión para publicar', 'Log in to post', 'Entre para publicar'],
    ['Cargando publicaciones…', 'Loading posts…', 'Carregando publicações…'], ['Cargando…', 'Loading…', 'Carregando…'],
    ['No hay publicaciones aún. ¡Sé el primero en publicar!', 'No posts yet. Be the first to post!', 'Ainda não há publicações. Seja o primeiro a publicar!'],
    ['No hay publicaciones todavía.', 'There are no posts yet.', 'Ainda não há publicações.'],
    ['Oops! Lo que buscas no se encuentra :(', 'Oops! We could not find what you are looking for :(', 'Ops! Não encontramos o que você procura :('],
    ['Ver más publicaciones', 'See more posts', 'Ver mais publicações'],
    ['Moda Sustentable', 'Sustainable Fashion', 'Moda Sustentável'],
    ['Al reutilizar e intercambiar ropa evitas el consumo innecesario y la contaminación de la industria textil.', 'By reusing and swapping clothes you avoid unnecessary consumption and pollution from the textile industry.', 'Ao reutilizar e trocar roupas você evita o consumo desnecessário e a poluição da indústria têxtil.'],
    ['Ver causas ecologistas »', 'See eco causes »', 'Ver causas ecológicas »'],
    // ---- tarjetas de publicación ----
    ['Me gusta', 'Like', 'Curtir'], ['Comentarios', 'Comments', 'Comentários'], ['Idioma', 'Language', 'Idioma'],
    ['Personalizado', 'Custom', 'Personalizado'], ['Barras y títulos:', 'Bars and titles:', 'Barras e títulos:'], ['Botones y detalles:', 'Buttons and details:', 'Botões e detalhes:'], ['Fondo de los paneles:', 'Panel background:', 'Fundo dos painéis:'],
    ['Los colores muy claros se oscurecen un poco para que los textos se lean bien.', 'Very light colors are darkened a little so the text is easy to read.', 'Cores muito claras são escurecidas um pouco para que os textos fiquem legíveis.'],
    ['Guardar', 'Save', 'Salvar'], ['Guardado', 'Saved', 'Salvo'], ['Agregar al carrito', 'Add to cart', 'Adicionar ao carrinho'], ['En el carrito', 'In the cart', 'No carrinho'],
    ['Contactar', 'Contact', 'Contatar'], ['Escribirle', 'Message', 'Escrever'], ['Editar', 'Edit', 'Editar'], ['Eliminar', 'Delete', 'Excluir'],
    ['Marcar vendida', 'Mark as sold', 'Marcar como vendida'], ['Reactivar', 'Reactivate', 'Reativar'], ['VENDIDA', 'SOLD', 'VENDIDA'], ['Denunciar', 'Report', 'Denunciar'],
    ['Guardar cambios', 'Save changes', 'Salvar alterações'], ['Cancelar', 'Cancel', 'Cancelar'], ['Aceptar', 'OK', 'OK'], ['Título:', 'Title:', 'Título:'],
    ['Comentar', 'Comment', 'Comentar'], ['Escribí un comentario', 'Write a comment', 'Escreva um comentário'], ['Escribí un comentario…', 'Write a comment…', 'Escreva um comentário…'],
    ['Cargando comentarios…', 'Loading comments…', 'Carregando comentários…'], ['Todavía no hay comentarios.', 'There are no comments yet.', 'Ainda não há comentários.'],
    ['Borrar comentario', 'Delete comment', 'Apagar comentário'], ['Foto de la publicación', 'Post photo', 'Foto da publicação'],
    ['Eliminar publicación', 'Delete post', 'Excluir publicação'], ['Se borra para siempre, con sus comentarios. ¿Seguro?', 'It will be deleted forever, along with its comments. Are you sure?', 'Será apagada para sempre, com seus comentários. Tem certeza?'],
    ['Denunciar publicación', 'Report post', 'Denunciar publicação'], ['¿Qué está mal con esta publicación?', 'What is wrong with this post?', 'O que há de errado com esta publicação?'],
    ['Ej: estafa, contenido inapropiado…', 'E.g. scam, inappropriate content…', 'Ex: golpe, conteúdo impróprio…'], ['Enviar denuncia', 'Send report', 'Enviar denúncia'], ['Denuncia enviada.', 'Report sent.', 'Denúncia enviada.'],
    ['Guardado en tu lista.', 'Saved to your list.', 'Salvo na sua lista.'], ['Quitado de guardados.', 'Removed from saved.', 'Removido dos salvos.'], ['Agregado al carrito.', 'Added to the cart.', 'Adicionado ao carrinho.'],
    ['Publicación creada!', 'Post created!', 'Publicação criada!'], ['¡Publicación creada!', 'Post created!', 'Publicação criada!'], ['Publicación actualizada.', 'Post updated.', 'Publicação atualizada.'], ['Publicación eliminada.', 'Post deleted.', 'Publicação excluída.'],
    ['Publicación', 'Post', 'Publicação'], ['la publicación', 'the post', 'a publicação'], ['una publicación', 'a post', 'uma publicação'], ['tu publicación', 'your post', 'sua publicação'],
    // ---- perfil ----
    ['Foto de Perfil', 'Profile Photo', 'Foto de Perfil'], ['Elegir foto de galería', 'Choose photo from gallery', 'Escolher foto da galeria'], ['Quitar foto', 'Remove photo', 'Remover foto'],
    ['Sin cuenta iniciada', 'Not logged in', 'Sem login'], ['Nombre de usuario:', 'Username:', 'Nome de usuário:'],
    ['Iniciá sesión para agregar una descripción...', 'Log in to add a description...', 'Entre para adicionar uma descrição...'],
    ['Escribí tu descripción personal o de tu feria…', 'Write your personal description or about your fair…', 'Escreva sua descrição pessoal ou da sua feira…'],
    ['Este usuario todavía no escribió una descripción.', 'This user has not written a description yet.', 'Este usuário ainda não escreveu uma descrição.'],
    ['Calificación:', 'Rating:', 'Avaliação:'], ['Todavía sin calificaciones', 'No ratings yet', 'Ainda sem avaliações'], ['Calificá a este usuario:', 'Rate this user:', 'Avalie este usuário:'],
    ['Tu calificación:', 'Your rating:', 'Sua avaliação:'], ['¡Gracias por calificar!', 'Thanks for rating!', 'Obrigado por avaliar!'], ['Calificar a este usuario', 'Rate this user', 'Avaliar este usuário'],
    ['Crear Nueva Publicación', 'Create New Post', 'Criar Nova Publicação'], ['Mis Publicaciones', 'My Posts', 'Minhas Publicações'], ['Mis Publicaciones Guardadas', 'My Saved Posts', 'Minhas Publicações Salvas'],
    ['Aún no tenés publicaciones en tu perfil. ¡Escribí una arriba!', 'You have no posts on your profile yet. Write one above!', 'Você ainda não tem publicações no seu perfil. Escreva uma acima!'],
    ['Debés', 'You must', 'Você deve'], ['o', 'or', 'ou'], ['Registrarte', 'Sign up', 'Cadastrar-se'], ['Registrate', 'Sign up', 'Cadastre-se'],
    ['para ver y diseñar tu perfil.', 'to see and design your profile.', 'para ver e personalizar seu perfil.'],
    ['Seguridad: cambiar contraseña', 'Security: change password', 'Segurança: alterar senha'], ['Contraseña actual:', 'Current password:', 'Senha atual:'], ['Contraseña nueva:', 'New password:', 'Nova senha:'],
    ['Repetir contraseña nueva:', 'Repeat new password:', 'Repita a nova senha:'], ['8 o más caracteres, con mayúscula, minúscula, número y símbolo.', '8 or more characters, with an uppercase letter, a lowercase letter, a number and a symbol.', '8 ou mais caracteres, com maiúscula, minúscula, número e símbolo.'],
    ['Mostrar contraseñas', 'Show passwords', 'Mostrar senhas'], ['Cambiar contraseña', 'Change password', 'Alterar senha'],
    ['Contraseña actualizada. Se cerró tu sesión en otros dispositivos.', 'Password updated. You were logged out on other devices.', 'Senha atualizada. Sua sessão foi encerrada em outros dispositivos.'],
    ['¡Cambios guardados!', 'Changes saved!', 'Alterações salvas!'], ['No se pudieron guardar los cambios.', 'The changes could not be saved.', 'Não foi possível salvar as alterações.'],
    ['Foto elegida. Tocá "Guardar cambios" para confirmarla.', 'Photo chosen. Tap "Save changes" to confirm it.', 'Foto escolhida. Toque em "Salvar alterações" para confirmar.'],
    ['Personalizar mi perfil', 'Customize my profile', 'Personalizar meu perfil'], ['Tema de colores:', 'Color theme:', 'Tema de cores:'],
    ['Fondo de pantalla (lo ven quienes visiten tu perfil):', 'Wallpaper (seen by anyone who visits your profile):', 'Papel de parede (visto por quem visitar seu perfil):'],
    ['Elegir imagen de fondo', 'Choose background image', 'Escolher imagem de fundo'], ['Quitar fondo', 'Remove background', 'Remover fundo'],
    ['Los cambios se guardan al instante y se ven en tu perfil.', 'Changes are saved instantly and show on your profile.', 'As alterações são salvas na hora e aparecem no seu perfil.'],
    ['Azul clásico', 'Classic blue', 'Azul clássico'], ['Rosa chicle', 'Bubblegum pink', 'Rosa chiclete'], ['Verde menta', 'Mint green', 'Verde menta'], ['Violeta', 'Violet', 'Violeta'], ['Atardecer', 'Sunset', 'Pôr do sol'], ['Grafito', 'Graphite', 'Grafite'],
    ['¡Fondo cambiado!', 'Background changed!', 'Fundo alterado!'], ['No se pudo cambiar el tema.', 'The theme could not be changed.', 'Não foi possível alterar o tema.'],
    ['No se pudo guardar el fondo.', 'The background could not be saved.', 'Não foi possível salvar o fundo.'], ['No se pudo quitar el fondo.', 'The background could not be removed.', 'Não foi possível remover o fundo.'],
    ['El servidor no está actualizado: reemplazá server.js y rutas.js y reiniciá (Ctrl+C y npm start).', 'The server is out of date: replace server.js and rutas.js and restart (Ctrl+C and npm start).', 'O servidor está desatualizado: substitua server.js e rutas.js e reinicie (Ctrl+C e npm start).'],
    ['Usuario no encontrado', 'User not found', 'Usuário não encontrado'], ['Enviar mensaje', 'Send message', 'Enviar mensagem'], ['Enviar Mensaje', 'Send Message', 'Enviar Mensagem'],
    ['Bloquear', 'Block', 'Bloquear'], ['Desbloquear', 'Unblock', 'Desbloquear'], ['Denunciar usuario', 'Report user', 'Denunciar usuário'], ['Contanos el motivo…', 'Tell us the reason…', 'Conte o motivo…'],
    ['Usuario bloqueado. No verás sus publicaciones ni podrán escribirte.', 'User blocked. You will not see their posts and they cannot message you.', 'Usuário bloqueado. Você não verá as publicações dele e ele não poderá escrever para você.'],
    ['Usuario bloqueado.', 'User blocked.', 'Usuário bloqueado.'], ['Usuario desbloqueado.', 'User unblocked.', 'Usuário desbloqueado.'],
    // ---- guardados / carrito ----
    ['Acá quedan las publicaciones que marcaste con el botón Guardar.', 'Posts you saved with the Save button appear here.', 'As publicações que você salvou com o botão Salvar ficam aqui.'],
    ['Todavía no guardaste nada. Tocá el botón Guardar en cualquier publicación.', 'You have not saved anything yet. Tap the Save button on any post.', 'Você ainda não salvou nada. Toque no botão Salvar em qualquer publicação.'],
    ['Mi Carrito', 'My Cart', 'Meu Carrinho'], ['Vaciar carrito', 'Empty cart', 'Esvaziar carrinho'], ['Vaciar', 'Empty', 'Esvaziar'], ['Quitar', 'Remove', 'Remover'],
    ['Total estimado:', 'Estimated total:', 'Total estimado:'], ['Tu carrito está vacío.', 'Your cart is empty.', 'Seu carrinho está vazio.'],
    ['Explorá el', 'Explore the', 'Explore o'], ['Inicio', 'Home', 'Início'], ['y tocá "Agregar al carrito".', 'and tap "Add to cart".', 'e toque em "Adicionar ao carrinho".'],
    ['¿Querés guardar más publicaciones? Explorá el', 'Want to save more posts? Explore the', 'Quer salvar mais publicações? Explore o'],
    ['y tocá en el botón Guardar de cualquier publicación.', 'and tap the Save button on any post.', 'e toque no botão Salvar em qualquer publicação.'],
    ['¿Querés quitar todo del carrito?', 'Do you want to remove everything from the cart?', 'Quer remover tudo do carrinho?'], ['Ya no está disponible', 'No longer available', 'Não está mais disponível'],
    ['Iniciá sesión para usar el carrito.', 'Log in to use the cart.', 'Entre para usar o carrinho.'], ['Iniciá sesión para ver tus publicaciones guardadas.', 'Log in to see your saved posts.', 'Entre para ver suas publicações salvas.'],
    ['Iniciá sesión para chatear.', 'Log in to chat.', 'Entre para conversar.'], ['No se pudo cargar el carrito.', 'The cart could not be loaded.', 'Não foi possível carregar o carrinho.'],
    ['Podés mirar todo el sitio sin cuenta, pero para publicar, comentar, guardar, usar el carrito o chatear necesitás ingresar.', 'You can browse the whole site without an account, but to post, comment, save, use the cart or chat you need to log in.', 'Você pode ver todo o site sem conta, mas para publicar, comentar, salvar, usar o carrinho ou conversar precisa entrar.'],
    // ---- chats ----
    ['Centro de Mensajes', 'Message Center', 'Central de Mensagens'], ['Cargando conversaciones…', 'Loading conversations…', 'Carregando conversas…'], ['Seleccioná un chat', 'Select a chat', 'Selecione uma conversa'],
    ['Aquí aparecerán los mensajes del chat.', 'Chat messages will appear here.', 'As mensagens da conversa aparecerão aqui.'], ['← Chats', '← Chats', '← Conversas'],
    ['Escribí un mensaje...', 'Write a message...', 'Escreva uma mensagem...'], ['Escribí un mensaje…', 'Write a message…', 'Escreva uma mensagem…'], ['Mensaje', 'Message', 'Mensagem'],
    ['Foto', 'Photo', 'Foto'], ['Emoji', 'Emoji', 'Emoji'], ['Foto lista para enviar (tocala para quitarla)', 'Photo ready to send (tap it to remove it)', 'Foto pronta para enviar (toque para remover)'],
    ['Foto enviada', 'Photo sent', 'Foto enviada'], ['Foto quitada.', 'Photo removed.', 'Foto removida.'], ['[Foto]', '[Photo]', '[Foto]'], ['Tocá para chatear', 'Tap to chat', 'Toque para conversar'],
    ['Sin conversaciones recientes. Buscá un usuario arriba o tocá "Contactar" en una publicación.', 'No recent conversations. Search for a user above or tap "Contact" on a post.', 'Sem conversas recentes. Busque um usuário acima ou toque em "Contatar" em uma publicação.'],
    ['Todavía no hay mensajes. ¡Saludá!', 'There are no messages yet. Say hi!', 'Ainda não há mensagens. Diga oi!'],
    ['Bloqueaste a este usuario. Desbloquealo para escribirle.', 'You blocked this user. Unblock them to write to them.', 'Você bloqueou este usuário. Desbloqueie para escrever.'],
    ['No podés enviar mensajes a este usuario.', 'You cannot send messages to this user.', 'Você não pode enviar mensagens a este usuário.'],
    ['No encontramos usuarios con ese nombre.', 'We did not find users with that name.', 'Não encontramos usuários com esse nome.'], ['Escribí al menos 2 letras.', 'Type at least 2 letters.', 'Digite pelo menos 2 letras.'],
    ['Elegí un chat primero.', 'Choose a chat first.', 'Escolha uma conversa primeiro.'], ['No podés chatear con vos mismo.', 'You cannot chat with yourself.', 'Você não pode conversar consigo mesmo.'],
    ['No se pudo abrir el chat.', 'The chat could not be opened.', 'Não foi possível abrir a conversa.'], ['No se pudo enviar.', 'It could not be sent.', 'Não foi possível enviar.'],
    // ---- donar / ayuda ----
    ['Donaciones y Causas Sustentables', 'Donations and Sustainable Causes', 'Doações e Causas Sustentáveis'],
    ['impulsamos la reutilización de prendas para frenar el impacto ambiental de la industria textil. Si querés colaborar con causas benéficas y ecológicas verificadas, podés apoyar a las siguientes organizaciones:', 'we promote the reuse of clothing to slow the environmental impact of the textile industry. If you want to support charitable and ecological causes, you can support the following organizations:', 'incentivamos a reutilização de roupas para frear o impacto ambiental da indústria têxtil. Se você quer apoiar causas beneficentes e ecológicas, pode apoiar as seguintes organizações:'],
    ['En', 'At', 'Na'], ['Galpón de Ropa', 'Galpón de Ropa', 'Galpón de Ropa'], ['Ando Reciclaje', 'Ando Reciclaje', 'Ando Reciclaje'],
    ['Información para donar ropa y apoyar su trabajo de sostenibilidad.', 'Information on donating clothes and supporting their sustainability work.', 'Informações para doar roupas e apoiar o trabalho de sustentabilidade deles.'],
    ['Información para donar indumentaria y darle una segunda vida.', 'Information on donating clothing and giving it a second life.', 'Informações para doar roupas e dar a elas uma segunda vida.'],
    ['Ir a donar »', 'Go donate »', 'Ir doar »'], ['(se abre en otra pestaña)', '(opens in a new tab)', '(abre em outra aba)'],
    ['Centro de Ayuda y Preguntas Frecuentes', 'Help Center and FAQ', 'Central de Ajuda e Perguntas Frequentes'],
    ['¿Necesito una cuenta para mirar?', 'Do I need an account to browse?', 'Preciso de uma conta para olhar?'],
    ['No. Podés recorrer todo el sitio sin cuenta. Para publicar, comentar, guardar, usar el carrito o chatear tenés que iniciar sesión o registrarte (botón de arriba a la derecha).', 'No. You can browse the whole site without an account. To post, comment, save, use the cart or chat you need to log in or sign up (button at the top right).', 'Não. Você pode navegar por todo o site sem conta. Para publicar, comentar, salvar, usar o carrinho ou conversar precisa entrar ou se cadastrar (botão no canto superior direito).'],
    ['¿Cómo publico una prenda o trueque?', 'How do I post an item or swap?', 'Como publico uma peça ou troca?'],
    ['Iniciá sesión y, desde "Inicio" o "Mi Perfil", completá el título, la descripción y el precio (o $0 para intercambio), sumá una foto si querés y presioná "Publicar".', 'Log in and, from "Home" or "My Profile", fill in the title, description and price (or $0 for a swap), add a photo if you like and press "Post".', 'Entre e, em "Início" ou "Meu Perfil", preencha o título, a descrição e o preço (ou $0 para troca), adicione uma foto se quiser e clique em "Publicar".'],
    ['¿Cómo contacto a un vendedor?', 'How do I contact a seller?', 'Como entro em contato com um vendedor?'],
    ['Tocá "Contactar" en cualquier publicación, o hacé clic en su nombre de usuario para ver su perfil y escribirle desde la sección de Chats.', 'Tap "Contact" on any post, or click their username to see their profile and write to them from the Chats section.', 'Toque em "Contatar" em qualquer publicação, ou clique no nome de usuário para ver o perfil e escrever pela seção de Conversas.'],
    ['¿Cómo funciona el carrito?', 'How does the cart work?', 'Como funciona o carrinho?'],
    ['Agregás las prendas que te interesan y Clothes4Us te muestra el total estimado. El pago y la entrega los coordinás por chat directamente con cada vendedor.', 'You add the items you like and Clothes4Us shows you the estimated total. Payment and delivery are arranged by chat directly with each seller.', 'Você adiciona as peças que lhe interessam e o Clothes4Us mostra o total estimado. O pagamento e a entrega são combinados por chat diretamente com cada vendedor.'],
    ['Clothes4Us conecta a compradores y vendedores: elegí tus prendas y coordiná el pago y la entrega por chat con cada vendedor.', 'Clothes4Us connects buyers and sellers: pick your items and arrange payment and delivery by chat with each seller.', 'O Clothes4Us conecta compradores e vendedores: escolha suas peças e combine o pagamento e a entrega por chat com cada vendedor.'],
    ['¿Cómo cambio mi nombre, foto o descripción?', 'How do I change my name, photo or description?', 'Como altero meu nome, foto ou descrição?'],
    ['Entrá a "Mi Perfil", editá lo que quieras y tocá "Guardar cambios".', 'Go to "My Profile", edit what you want and tap "Save changes".', 'Acesse "Meu Perfil", edite o que quiser e toque em "Salvar alterações".'],
    ['¿No te llegó el código?', 'Did the code not arrive?', 'O código não chegou?'],
    ['En la pantalla de inicio de sesión tocá "¿Te olvidaste tu contraseña?". Te enviamos un código de 6 números al correo o teléfono con el que te registraste.', 'On the login screen tap "Forgot your password?". We send a 6-digit code to the email or phone you signed up with.', 'Na tela de login toque em "Esqueceu sua senha?". Enviamos um código de 6 números para o e-mail ou telefone com que você se cadastrou.'],
    ['¿No encontrás tu problema?', 'Cannot find your problem?', 'Não encontrou seu problema?'], ['Vi algo que no corresponde', 'I saw something that is not right', 'Vi algo que não está certo'],
    ['Usá el botón "Denunciar" de la publicación o del usuario. También podés bloquear a alguien desde su perfil o desde el chat.', 'Use the "Report" button on the post or the user. You can also block someone from their profile or from the chat.', 'Use o botão "Denunciar" da publicação ou do usuário. Você também pode bloquear alguém pelo perfil ou pelo chat.'],
    ['Escribinos directamente a nuestro equipo de soporte:', 'Write directly to our support team:', 'Escreva diretamente para nossa equipe de suporte:'],
    // ---- login / registro / recuperar ----
    ['Entrá para comprar, vender e intercambiar ropa.', 'Log in to buy, sell and swap clothes.', 'Entre para comprar, vender e trocar roupas.'],
    ['Usuario, correo o teléfono:', 'Username, email or phone:', 'Usuário, e-mail ou telefone:'], ['Tu usuario, correo o teléfono', 'Your username, email or phone', 'Seu usuário, e-mail ou telefone'],
    ['Contraseña:', 'Password:', 'Senha:'], ['Tu contraseña', 'Your password', 'Sua senha'], ['Mostrar contraseña', 'Show password', 'Mostrar senha'], ['Ocultar contraseña', 'Hide password', 'Ocultar senha'],
    ['Recordarme en este dispositivo', 'Remember me on this device', 'Lembrar-me neste dispositivo'], ['Ingresar', 'Log in', 'Entrar'], ['¿Olvidaste tu contraseña?', 'Forgot your password?', 'Esqueceu sua senha?'], ['¿Te olvidaste tu contraseña?', 'Forgot your password?', 'Esqueceu sua senha?'],
    ['Me olvidé mi contraseña', 'I forgot my password', 'Esqueci minha senha'], ['¿No tenés cuenta?', 'Do not have an account?', 'Não tem conta?'], ['¿Ya tenés cuenta?', 'Already have an account?', 'Já tem conta?'],
    ['Crear cuenta', 'Create account', 'Criar conta'], ['Crear Cuenta', 'Create Account', 'Criar Conta'], ['Sumate y dale una segunda vida a la ropa.', 'Join us and give clothes a second life.', 'Junte-se e dê uma segunda vida às roupas.'],
    ['ej: lola_vintage', 'e.g. lola_vintage', 'ex: lola_vintage'], ['4 a 20 caracteres, con al menos una letra y un símbolo (_ . - # $ !). Ej: lola_vintage', '4 to 20 characters, with at least one letter and one symbol (_ . - # $ !). E.g. lola_vintage', '4 a 20 caracteres, com pelo menos uma letra e um símbolo (_ . - # $ !). Ex: lola_vintage'],
    ['Correo electrónico o teléfono:', 'Email or phone:', 'E-mail ou telefone:'], ['Correo o teléfono:', 'Email or phone:', 'E-mail ou telefone:'], ['correo@ejemplo.com o +54 9 11 1234 5678', 'email@example.com or +54 9 11 1234 5678', 'email@exemplo.com ou +54 9 11 1234 5678'],
    ['Lo usamos para ayudarte si perdés tu contraseña.', 'We use it to help you if you lose your password.', 'Usamos para ajudar você se perder sua senha.'],
    ['Elegí una contraseña segura', 'Choose a strong password', 'Escolha uma senha segura'], ['8 o más caracteres', '8 or more characters', '8 ou mais caracteres'], ['Una mayúscula', 'One uppercase letter', 'Uma maiúscula'], ['Una minúscula', 'One lowercase letter', 'Uma minúscula'], ['Un número', 'One number', 'Um número'], ['Un símbolo', 'One symbol', 'Um símbolo'],
    ['Repetir contraseña:', 'Repeat password:', 'Repita a senha:'], ['Escribila de nuevo', 'Type it again', 'Digite novamente'],
    ['Ingresá el correo o el teléfono con el que te registraste y te enviamos un código de 6 números para crear una contraseña nueva.', 'Enter the email or phone you signed up with and we will send you a 6-digit code to create a new password.', 'Digite o e-mail ou telefone com que você se cadastrou e enviaremos um código de 6 números para criar uma nova senha.'],
    ['Tu correo o teléfono registrado', 'Your registered email or phone', 'Seu e-mail ou telefone cadastrado'], ['Enviar código', 'Send code', 'Enviar código'], ['← Volver a iniciar sesión', '← Back to log in', '← Voltar para entrar'],
    ['Nueva contraseña', 'New password', 'Nova senha'], ['Crear nueva contraseña', 'Create new password', 'Criar nova senha'], ['Nueva contraseña:', 'New password:', 'Nova senha:'],
    ['Ingresá el código de 6 números que te enviamos y elegí tu nueva contraseña. El código vence en 15 minutos.', 'Enter the 6-digit code we sent you and choose your new password. The code expires in 15 minutes.', 'Digite o código de 6 números que enviamos e escolha sua nova senha. O código expira em 15 minutos.'],
    ['Escribilo igual que cuando te registraste.', 'Type it the same way you did when you signed up.', 'Digite igual a como fez no cadastro.'], ['Código de 6 números:', '6-digit code:', 'Código de 6 números:'],
    ['Guardar nueva contraseña', 'Save new password', 'Salvar nova senha'], ['Pedir otro', 'Ask for another', 'Pedir outro'],
    ['Completá tu usuario y tu contraseña.', 'Enter your username and password.', 'Preencha seu usuário e sua senha.'], ['El correo no es válido.', 'The email is not valid.', 'O e-mail não é válido.'],
    ['El código tiene 6 números.', 'The code has 6 digits.', 'O código tem 6 números.'], ['El teléfono no es válido (8 a 15 números, podés empezar con +).', 'The phone number is not valid (8 to 15 digits, you can start with +).', 'O telefone não é válido (8 a 15 números, pode começar com +).'],
    ['Ese usuario no está disponible.', 'That username is not available.', 'Esse usuário não está disponível.'], ['Falta al menos un símbolo (_ . - # $ !).', 'At least one symbol is missing (_ . - # $ !).', 'Falta pelo menos um símbolo (_ . - # $ !).'],
    ['Ingresá un correo o un teléfono.', 'Enter an email or a phone number.', 'Digite um e-mail ou um telefone.'], ['La contraseña debe tener 8 o más caracteres, una mayúscula, una minúscula, un número y un símbolo.', 'The password must have 8 or more characters, an uppercase letter, a lowercase letter, a number and a symbol.', 'A senha deve ter 8 ou mais caracteres, uma maiúscula, uma minúscula, um número e um símbolo.'],
    ['Las contraseñas coinciden.', 'The passwords match.', 'As senhas coincidem.'], ['Las contraseñas no coinciden.', 'The passwords do not match.', 'As senhas não coincidem.'],
    ['No pudimos cambiar la contraseña.', 'We could not change the password.', 'Não conseguimos alterar a senha.'], ['No pudimos crear la cuenta.', 'We could not create the account.', 'Não conseguimos criar a conta.'], ['No pudimos enviar el código.', 'We could not send the code.', 'Não conseguimos enviar o código.'], ['No pudimos iniciar sesión.', 'We could not log you in.', 'Não conseguimos fazer o login.'],
    ['No pudimos conectarnos al servidor. Abrí el sitio desde http://localhost:3000 (o la IP de tu PC) y revisá que el servidor esté encendido.', 'We could not connect to the server. Open the site from http://localhost:3000 (or your PC IP) and check that the server is on.', 'Não conseguimos conectar ao servidor. Abra o site em http://localhost:3000 (ou o IP do seu PC) e verifique se o servidor está ligado.'],
    ['No pudimos conectarnos al servidor. Revisá tu conexión.', 'We could not connect to the server. Check your connection.', 'Não conseguimos conectar ao servidor. Verifique sua conexão.'],
    ['Revisando si está disponible…', 'Checking if it is available…', 'Verificando se está disponível…'], ['Revisá los campos marcados.', 'Check the highlighted fields.', 'Verifique os campos marcados.'],
    ['Solo letras, números y los símbolos _ . - # $ ! (sin espacios).', 'Only letters, numbers and the symbols _ . - # $ ! (no spaces).', 'Somente letras, números e os símbolos _ . - # $ ! (sem espaços).'],
    ['¡Contraseña actualizada! Te llevamos al inicio de sesión…', 'Password updated! Taking you to the login…', 'Senha atualizada! Levando você ao login…'], ['¡Ese usuario está disponible!', 'That username is available!', 'Esse usuário está disponível!'],
    // ---- imágenes ----
    ['Elegí un archivo de imagen.', 'Choose an image file.', 'Escolha um arquivo de imagem.'], ['La imagen es demasiado pesada.', 'The image is too large.', 'A imagem é muito pesada.'], ['No pudimos leer esa imagen.', 'We could not read that image.', 'Não conseguimos ler essa imagem.'],
    // ---- errores del servidor ----
    ['No se pudieron cargar las publicaciones.', 'The posts could not be loaded.', 'Não foi possível carregar as publicações.'], ['No se pudieron cargar los comentarios.', 'The comments could not be loaded.', 'Não foi possível carregar os comentários.'],
    ['No se pudo calificar.', 'It could not be rated.', 'Não foi possível avaliar.'], ['No se pudo cambiar la contraseña.', 'The password could not be changed.', 'Não foi possível alterar a senha.'], ['No se pudo comentar.', 'The comment could not be posted.', 'Não foi possível comentar.'],
    ['No se pudo completar la acción.', 'The action could not be completed.', 'Não foi possível concluir a ação.'], ['No se pudo completar.', 'It could not be completed.', 'Não foi possível concluir.'], ['No se pudo publicar.', 'It could not be posted.', 'Não foi possível publicar.'],
    ['Ese usuario no existe.', 'That user does not exist.', 'Esse usuário não existe.'],
    ['Comentario inválido.', 'Invalid comment.', 'Comentário inválido.'], ['Denuncia inválida.', 'Invalid report.', 'Denúncia inválida.'], ['El comentario es muy largo (máximo 500 caracteres).', 'The comment is too long (maximum 500 characters).', 'O comentário é muito longo (máximo 500 caracteres).'],
    ['El mensaje es muy largo (máximo 1000 caracteres).', 'The message is too long (maximum 1000 characters).', 'A mensagem é muito longa (máximo 1000 caracteres).'], ['El precio no es válido (usá 0 para trueque).', 'The price is not valid (use 0 for a swap).', 'O preço não é válido (use 0 para troca).'],
    ['El título debe tener entre 3 y 80 caracteres.', 'The title must be between 3 and 80 characters.', 'O título deve ter entre 3 e 80 caracteres.'], ['Elegí de 1 a 5 estrellas.', 'Choose 1 to 5 stars.', 'Escolha de 1 a 5 estrelas.'],
    ['Esa prenda ya fue vendida.', 'That item has already been sold.', 'Essa peça já foi vendida.'], ['Esa publicación no existe.', 'That post does not exist.', 'Essa publicação não existe.'], ['Escribí un comentario.', 'Write a comment.', 'Escreva um comentário.'], ['Escribí un mensaje.', 'Write a message.', 'Escreva uma mensagem.'],
    ['Ese comentario no existe.', 'That comment does not exist.', 'Esse comentário não existe.'], ['Ese nombre de usuario ya está en uso.', 'That username is already taken.', 'Esse nome de usuário já está em uso.'], ['Ese tema no existe.', 'That theme does not exist.', 'Esse tema não existe.'],
    ['La contraseña actual no es correcta.', 'The current password is not correct.', 'A senha atual não está correta.'], ['La descripción debe tener entre 5 y 1000 caracteres.', 'The description must be between 5 and 1000 characters.', 'A descrição deve ter entre 5 e 1000 caracteres.'],
    ['La descripción es muy larga (máximo 300 caracteres).', 'The description is too long (maximum 300 characters).', 'A descrição é muito longa (máximo 300 caracteres).'], ['La foto no es válida o pesa demasiado.', 'The photo is not valid or is too large.', 'A foto não é válida ou é muito pesada.'],
    ['La imagen de fondo no es válida o pesa demasiado.', 'The background image is not valid or is too large.', 'A imagem de fundo não é válida ou é muito pesada.'], ['La imagen no es válida o pesa demasiado.', 'The image is not valid or is too large.', 'A imagem não é válida ou é muito pesada.'],
    ['Las contraseñas nuevas no coinciden.', 'The new passwords do not match.', 'As novas senhas não coincidem.'], ['No podés agregar tus propias publicaciones al carrito.', 'You cannot add your own posts to the cart.', 'Você não pode adicionar suas próprias publicações ao carrinho.'],
    ['No podés borrar ese comentario.', 'You cannot delete that comment.', 'Você não pode apagar esse comentário.'], ['No podés calificarte a vos mismo.', 'You cannot rate yourself.', 'Você não pode avaliar a si mesmo.'], ['No se puede enviar mensajes a este usuario.', 'Messages cannot be sent to this user.', 'Não é possível enviar mensagens a este usuário.'],
    ['Publicación inválida.', 'Invalid post.', 'Publicação inválida.'], ['Solo podés modificar tus publicaciones.', 'You can only edit your own posts.', 'Você só pode editar suas próprias publicações.'], ['Tenés que iniciar sesión.', 'You need to log in.', 'Você precisa entrar.'], ['Usuario inválido.', 'Invalid user.', 'Usuário inválido.'],
    ['Completá todos los campos.', 'Fill in all the fields.', 'Preencha todos os campos.'], ['Contraseña actualizada. Ya podés iniciar sesión.', 'Password updated. You can now log in.', 'Senha atualizada. Agora você pode entrar.'], ['Datos inválidos.', 'Invalid data.', 'Dados inválidos.'],
    ['Demasiados intentos. Probá de nuevo en unos minutos.', 'Too many attempts. Try again in a few minutes.', 'Muitas tentativas. Tente novamente em alguns minutos.'], ['El archivo es demasiado pesado.', 'The file is too large.', 'O arquivo é muito pesado.'],
    ['El código es incorrecto o venció. Pedí uno nuevo.', 'The code is wrong or has expired. Ask for a new one.', 'O código está incorreto ou expirou. Peça um novo.'],
    ['El usuario debe incluir al menos un símbolo (_ . - # $ !).', 'The username must include at least one symbol (_ . - # $ !).', 'O usuário deve incluir pelo menos um símbolo (_ . - # $ !).'], ['El usuario debe incluir al menos una letra.', 'The username must include at least one letter.', 'O usuário deve incluir pelo menos uma letra.'],
    ['El usuario debe tener entre 4 y 20 caracteres.', 'The username must be between 4 and 20 characters.', 'O usuário deve ter entre 4 e 20 caracteres.'], ['Ingresá un correo o un número de teléfono.', 'Enter an email or a phone number.', 'Digite um e-mail ou um número de telefone.'],
    ['Ingresá un nombre de usuario.', 'Enter a username.', 'Digite um nome de usuário.'], ['Inicio de sesión exitoso', 'Logged in successfully', 'Login realizado com sucesso'], ['Usuario registrado con éxito', 'User registered successfully', 'Usuário cadastrado com sucesso'],
    ['La contraseña debe incluir un número.', 'The password must include a number.', 'A senha deve incluir um número.'], ['La contraseña debe incluir un símbolo (por ejemplo ! ? # $ _).', 'The password must include a symbol (for example ! ? # $ _).', 'A senha deve incluir um símbolo (por exemplo ! ? # $ _).'],
    ['La contraseña debe incluir una mayúscula.', 'The password must include an uppercase letter.', 'A senha deve incluir uma maiúscula.'], ['La contraseña debe incluir una minúscula.', 'The password must include a lowercase letter.', 'A senha deve incluir uma minúscula.'],
    ['La contraseña debe tener al menos 8 caracteres.', 'The password must have at least 8 characters.', 'A senha deve ter pelo menos 8 caracteres.'], ['La contraseña es demasiado larga (máximo 72 caracteres).', 'The password is too long (maximum 72 characters).', 'A senha é muito longa (máximo 72 caracteres).'],
    ['No encontrado.', 'Not found.', 'Não encontrado.'], ['No hay sesión iniciada.', 'You are not logged in.', 'Você não está logado.'], ['Página no encontrada', 'Page not found', 'Página não encontrada'], ['Revisá los datos ingresados.', 'Check the data you entered.', 'Verifique os dados digitados.'],
    ['Si el contacto está registrado, te enviamos un código de 6 números.', 'If the contact is registered, we sent you a 6-digit code.', 'Se o contato estiver cadastrado, enviamos um código de 6 números.'], ['Usuario o contraseña incorrectos.', 'Wrong username or password.', 'Usuário ou senha incorretos.'],
    ['Ya existe una cuenta con este correo o número.', 'An account with this email or number already exists.', 'Já existe uma conta com este e-mail ou número.'], ['Ya existe una cuenta con este correo o número. Iniciá sesión.', 'An account with this email or number already exists. Log in.', 'Já existe uma conta com este e-mail ou número. Entre.'],
    // ---- red social: respuestas, votos, compartir, seguidores, chats ----
    ['Compartir', 'Share', 'Compartilhar'],
    ['Compartir publicación', 'Share post', 'Compartilhar publicação'],
    ['Copiar enlace', 'Copy link', 'Copiar link'],
    ['Otras apps', 'Other apps', 'Outros apps'],
    ['Enviar por chat', 'Send by chat', 'Enviar por chat'],
    ['Enlace copiado.', 'Link copied.', 'Link copiado.'],
    ['Buscar usuario…', 'Search user…', 'Buscar usuário…'],
    ['Buscar usuario', 'Search user', 'Buscar usuário'],
    ['Enviar', 'Send', 'Enviar'],
    ['Enviado', 'Sent', 'Enviado'],
    ['Cerrar', 'Close', 'Fechar'],
    ['Foto', 'Photo', 'Foto'],
    ['Foto ampliada', 'Enlarged photo', 'Foto ampliada'],
    ['Publicación compartida', 'Shared post', 'Publicação compartilhada'],
    ['Iniciá sesión para mandarla por chat a tus amigos.', 'Log in to send it by chat to your friends.', 'Entre para enviá-la por chat aos seus amigos.'],
    ['Todavía no tenés amigos ni seguidos. Buscá a alguien arriba.', 'You have no friends or followed users yet. Search for someone above.', 'Você ainda não tem amigos nem seguidos. Busque alguém acima.'],
    ['No encontramos usuarios con ese nombre.', 'We could not find users with that name.', 'Não encontramos usuários com esse nome.'],
    ['Responder', 'Reply', 'Responder'],
    ['Borrar', 'Delete', 'Apagar'],
    ['Me gusta', 'Like', 'Curtir'],
    ['No me gusta', 'Dislike', 'Não curti'],
    ['Escribí tu respuesta…', 'Write your reply…', 'Escreva sua resposta…'],
    ['Cancelar respuesta', 'Cancel reply', 'Cancelar resposta'],
    ['Agregar foto', 'Add photo', 'Adicionar foto'],
    ['Foto del comentario', 'Comment photo', 'Foto do comentário'],
    ['Foto lista para enviar (tocala para quitarla)', 'Photo ready to send (tap it to remove)', 'Foto pronta para enviar (toque para remover)'],
    ['Foto quitada.', 'Photo removed.', 'Foto removida.'],
    ['Denunciar comentario', 'Report comment', 'Denunciar comentário'],
    ['¿Qué está mal con este comentario?', 'What is wrong with this comment?', 'O que há de errado com este comentário?'],
    ['Ej: insultos, spam, contenido inapropiado…', 'E.g. insults, spam, inappropriate content…', 'Ex: insultos, spam, conteúdo impróprio…'],
    ['Borrar comentario', 'Delete comment', 'Apagar comentário'],
    ['Se borra este comentario.', 'This comment will be deleted.', 'Este comentário será apagado.'],
    ['Se borra el comentario y todas sus respuestas.', 'The comment and all its replies will be deleted.', 'O comentário e todas as respostas serão apagados.'],
    ['Tu comentario está oculto por denuncias hasta que lo revisemos.', 'Your comment is hidden due to reports until we review it.', 'Seu comentário está oculto por denúncias até que o revisemos.'],
    ['Escribí un comentario o agregá una foto.', 'Write a comment or add a photo.', 'Escreva um comentário ou adicione uma foto.'],
    ['Para vos', 'For you', 'Para você'],
    ['Recientes', 'Recent', 'Recentes'],
    ['Seguidos', 'Following', 'Seguindo'],
    ['Seguidores', 'Followers', 'Seguidores'],
    ['Amigos', 'Friends', 'Amigos'],
    ['Seguir', 'Follow', 'Seguir'],
    ['Siguiendo', 'Following', 'Seguindo'],
    ['Son amigos', 'You are friends', 'São amigos'],
    ['Te sigue', 'Follows you', 'Segue você'],
    ['Todavía no hay nadie en esta lista.', 'There is nobody on this list yet.', 'Ainda não há ninguém nesta lista.'],
    ['Todavía no hay publicaciones de la gente que seguís. Seguí a otras personas desde su perfil.', 'No posts yet from the people you follow. Follow other people from their profile.', 'Ainda não há publicações de quem você segue. Siga outras pessoas pelo perfil delas.'],
    ['Fijar', 'Pin', 'Fixar'],
    ['Desfijar', 'Unpin', 'Desafixar'],
    ['Silenciar', 'Mute', 'Silenciar'],
    ['Activar avisos', 'Unmute', 'Ativar avisos'],
    ['Vaciar chat', 'Clear chat', 'Limpar conversa'],
    ['Fijado', 'Pinned', 'Fixado'],
    ['Silenciado', 'Muted', 'Silenciado'],
    ['Chat fijado arriba.', 'Chat pinned to the top.', 'Conversa fixada no topo.'],
    ['Chat desfijado.', 'Chat unpinned.', 'Conversa desafixada.'],
    ['Chat silenciado: no suma al numerito del menú.', 'Chat muted: it does not add to the menu counter.', 'Conversa silenciada: não soma no número do menu.'],
    ['Avisos activados.', 'Notifications on.', 'Avisos ativados.'],
    ['Chat vaciado.', 'Chat cleared.', 'Conversa limpa.'],
    ['Moderación', 'Moderation', 'Moderação'],
    ['Moderación - Clothes4Us', 'Moderation - Clothes4Us', 'Moderação - Clothes4Us'],
    ['Moderación: denuncias pendientes', 'Moderation: pending reports', 'Moderação: denúncias pendentes'],
    ['Descartar', 'Dismiss', 'Descartar'],
    ['Ocultar', 'Hide', 'Ocultar'],
    ['Restaurar', 'Restore', 'Restaurar'],
    ['Eliminar', 'Delete', 'Excluir'],
    ['No hay denuncias pendientes. ¡Todo tranquilo!', 'No pending reports. All quiet!', 'Não há denúncias pendentes. Tudo tranquilo!'],
    ['Ya denunciaste esto. Lo estamos revisando.', 'You already reported this. We are reviewing it.', 'Você já denunciou isto. Estamos revisando.'],
    ['No podés denunciarte a vos mismo.', 'You cannot report yourself.', 'Você não pode denunciar a si mesmo.'],
    ['No podés seguir a este usuario.', 'You cannot follow this user.', 'Você não pode seguir este usuário.'],
    ['No podés comentar en esta publicación.', 'You cannot comment on this post.', 'Você não pode comentar nesta publicação.'],
    ['Ese comentario ya no existe.', 'That comment no longer exists.', 'Esse comentário não existe mais.'],
    ['Voto inválido.', 'Invalid vote.', 'Voto inválido.'],
  ];

  // Textos que llevan números o nombres adentro. Cada uno devuelve [inglés, portugués].
  function plural(n, s1, sn) { return n === '1' ? s1 : sn; }
  var PATRONES = [
    [/^Respondió a @(.+)$/, function (m) { return ['Replied to @' + m[1], 'Respondeu a @' + m[1]]; }],
    [/^Respondiendo a @(.+)$/, function (m) { return ['Replying to @' + m[1], 'Respondendo a @' + m[1]]; }],
    [/^Enviada a @(.+)$/, function (m) { return ['Sent to @' + m[1], 'Enviada a @' + m[1]]; }],
    [/^Ahora seguís a @(.+?)(\. ¡Ya son amigos!|\.)$/, function (m) { var a = m[2] !== '.'; return ['You now follow @' + m[1] + (a ? '. You are now friends!' : '.'), 'Você agora segue @' + m[1] + (a ? '. Agora vocês são amigos!' : '.')]; }],
    [/^Dejaste de seguir a @(.+)\.$/, function (m) { return ['You stopped following @' + m[1] + '.', 'Você deixou de seguir @' + m[1] + '.']; }],
    [/^Podés fijar hasta (\d+) chats\.$/, function (m) { return ['You can pin up to ' + m[1] + ' chats.', 'Você pode fixar até ' + m[1] + ' conversas.']; }],
    [/^Se borran los mensajes de esta conversación solo para vos\. @(.+) los sigue viendo\. ¿Seguro\?$/, function (m) { return ['Messages in this conversation are deleted only for you. @' + m[1] + ' still sees them. Are you sure?', 'As mensagens desta conversa são apagadas só para você. @' + m[1] + ' continua vendo. Tem certeza?']; }],
    [/^Este es el enlace: (.+)$/, function (m) { return ['This is the link: ' + m[1], 'Este é o link: ' + m[1]]; }],
    [/^Me gusta \((\d+)\)$/, function (m) { return ['Like (' + m[1] + ')', 'Curtir (' + m[1] + ')']; }],
    [/^Comentarios \((\d+)\)$/, function (m) { return ['Comments (' + m[1] + ')', 'Comentários (' + m[1] + ')']; }],
    [/^Hola, (.+)$/, function (m) { return ['Hi, ' + m[1], 'Olá, ' + m[1]]; }],
    [/^Publicaciones de @(.+)$/, function (m) { return ['Posts by @' + m[1], 'Publicações de @' + m[1]]; }],
    [/^@(.+) todavía no tiene publicaciones\.$/, function (m) { return ['@' + m[1] + ' has no posts yet.', '@' + m[1] + ' ainda não tem publicações.']; }],
    [/^¿Qué pasó con @(.+)\?$/, function (m) { return ['What happened with @' + m[1] + '?', 'O que aconteceu com @' + m[1] + '?']; }],
    [/^Sobre: (.+)$/, function (m) { return ['About: ' + m[1], 'Sobre: ' + m[1]]; }],
    [/^Vende$/, function () { return ['Sold by', 'Vendido por']; }],
    [/^Foto de (.+)$/, function (m) { return ['Photo of ' + m[1], 'Foto de ' + m[1]]; }],
    [/^Tema (.+)$/, function (m) { var x = MAPA[m[1]] || [m[1], m[1]]; return ['Theme ' + x[0], 'Tema ' + x[1]]; }],
    [/^Emoji (.+)$/, function (m) { return ['Emoji ' + m[1], 'Emoji ' + m[1]]; }],
    [/^hace un momento$/, function () { return ['just now', 'agora mesmo']; }],
    [/^hace (\d+) min$/, function (m) { return [m[1] + ' min ago', 'há ' + m[1] + ' min']; }],
    [/^hace (\d+) horas?$/, function (m) { return [m[1] + (m[1] === '1' ? ' hour ago' : ' hours ago'), 'há ' + m[1] + (m[1] === '1' ? ' hora' : ' horas')]; }],
    [/^hace (\d+) días?$/, function (m) { return [m[1] + (m[1] === '1' ? ' day ago' : ' days ago'), 'há ' + m[1] + (m[1] === '1' ? ' dia' : ' dias')]; }],
    [/^(\$[\d.,]+ ARS) \+ (\d+) trueques?$/, function (m) { return [m[1] + ' + ' + m[2] + (m[2] === '1' ? ' swap' : ' swaps'), m[1] + ' + ' + m[2] + (m[2] === '1' ? ' troca' : ' trocas')]; }],
    [/^([★☆]+) \(([\d.]+) · (\d+) opini(?:ón|ones)\)$/, function (m) { return [m[1] + ' (' + m[2] + ' · ' + m[3] + (m[3] === '1' ? ' review)' : ' reviews)'), m[1] + ' (' + m[2] + ' · ' + m[3] + (m[3] === '1' ? ' avaliação)' : ' avaliações)')]; }],
    [/^Demasiados intentos fallidos\. Probá de nuevo en (\d+) min o recuperá tu contraseña\.$/, function (m) { return ['Too many failed attempts. Try again in ' + m[1] + ' min or recover your password.', 'Muitas tentativas falhas. Tente novamente em ' + m[1] + ' min ou recupere sua senha.']; }]
  ];

  var MAPA = {};
  TEXTOS.forEach(function (t) { MAPA[t[0]] = [t[1], t[2]]; });

  var idioma = 'es';
  try {
    var g = localStorage.getItem('idioma');
    if (IDIOMAS.indexOf(g) >= 0) idioma = g;
    else {
      var nav = String(navigator.language || 'es').slice(0, 2).toLowerCase();
      if (IDIOMAS.indexOf(nav) >= 0) idioma = nav;
    }
  } catch (e) { /* modo privado */ }

  function indice() { return idioma === 'en' ? 0 : 1; }

  function traducirPieza(s) {
    if (MAPA[s]) return MAPA[s][indice()];
    for (var i = 0; i < PATRONES.length; i++) {
      var m = PATRONES[i][0].exec(s);
      if (m) return PATRONES[i][1](m)[indice()];
    }
    return null;
  }

  // Traduce un texto completo manteniendo los espacios del principio y del final.
  function traducir(texto) {
    var ini = /^\s*/.exec(texto)[0], fin = /\s*$/.exec(texto)[0];
    var nucleo = texto.slice(ini.length, texto.length - fin.length).replace(/\s+/g, ' ');
    if (!nucleo) return texto;
    var r = traducirPieza(nucleo);
    if (r === null && nucleo.indexOf(' · ') > 0) {          // ej: "hace 3 min · Ropa"
      var partes = nucleo.split(' · '), hubo = false;
      partes = partes.map(function (p) { var t = traducirPieza(p); if (t !== null) hubo = true; return t === null ? p : t; });
      if (hubo) r = partes.join(' · ');
    }
    if (r === null) {                                       // ej: "Hola, ana  ✕"
      var suf = /^(.*?)(\s+✕)$/.exec(nucleo);
      if (suf) { var t2 = traducirPieza(suf[1]); if (t2 !== null) r = t2 + suf[2]; }
    }
    return r === null ? texto : ini + r + fin;
  }

  // ---- recorrer la página ----
  var ATRIBUTOS = ['placeholder', 'title', 'aria-label', 'alt'];
  var NO_TRADUCIR = 'script,style,textarea,[data-no-traducir],.post-body p:not(.post-precio),.post-body strong,.comentario-cuerpo p,.chat-texto,.bio-texto,.post-username,.chat-user-info strong';
  var NO_TRADUCIR_ATTR = '[data-no-traducir],.post-body p:not(.post-precio),.comentario-cuerpo p,.chat-texto,.bio-texto';
  var textos = new WeakMap();   // nodo de texto -> { orig, mostrado }
  var attrs = new WeakMap();    // elemento -> { atributo: { orig, mostrado } }

  function excluido(el) { return !!(el && el.closest && el.closest(NO_TRADUCIR)); }
  function excluidoAttr(el) { return !!(el && el.closest && el.closest(NO_TRADUCIR_ATTR)); }

  function procesarTexto(nodo) {
    if (excluido(nodo.parentNode)) return;
    var actual = nodo.nodeValue, rec = textos.get(nodo);
    var orig = rec && actual === rec.mostrado ? rec.orig : actual;
    var nuevo = idioma === 'es' ? orig : traducir(orig);
    if (nuevo !== actual) nodo.nodeValue = nuevo;
    if (nuevo !== orig || rec) textos.set(nodo, { orig: orig, mostrado: nuevo });
  }

  function procesarAtributos(el) {
    if (!el.getAttribute || excluidoAttr(el)) return;
    ATRIBUTOS.forEach(function (a) {
      if (!el.hasAttribute(a)) return;
      var mapa = attrs.get(el); if (!mapa) { mapa = {}; attrs.set(el, mapa); }
      var actual = el.getAttribute(a), rec = mapa[a];
      var orig = rec && actual === rec.mostrado ? rec.orig : actual;
      var nuevo = idioma === 'es' ? orig : traducir(orig);
      if (nuevo !== actual) el.setAttribute(a, nuevo);
      if (nuevo !== orig || rec) mapa[a] = { orig: orig, mostrado: nuevo };
    });
  }

  function procesar(raiz) {
    if (!raiz) return;
    if (raiz.nodeType === 3) { procesarTexto(raiz); return; }
    if (raiz.nodeType !== 1) return;
    procesarAtributos(raiz);
    var it = document.createTreeWalker(raiz, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = it.nextNode())) { if (n.nodeType === 3) procesarTexto(n); else procesarAtributos(n); }
  }

  var observador = new MutationObserver(function (cambios) {
    cambios.forEach(function (c) {
      if (c.type === 'childList') { for (var i = 0; i < c.addedNodes.length; i++) procesar(c.addedNodes[i]); }
      else if (c.type === 'characterData') procesarTexto(c.target);
      else if (c.type === 'attributes') procesarAtributos(c.target);
    });
  });

  // ---- selector de idioma con banderitas (SVG, no emojis) ----
  var BANDERAS = {
    es: '<rect width="30" height="20" fill="#74acdf"/><rect y="6.67" width="30" height="6.67" fill="#fff"/><circle cx="15" cy="10" r="2.3" fill="#f6b40e"/>',
    en: '<rect width="30" height="20" fill="#012169"/><path d="M0 0L30 20M30 0L0 20" stroke="#fff" stroke-width="4"/><path d="M0 0L30 20M30 0L0 20" stroke="#c8102e" stroke-width="1.4"/><path d="M15 0V20M0 10H30" stroke="#fff" stroke-width="6"/><path d="M15 0V20M0 10H30" stroke="#c8102e" stroke-width="3.4"/>',
    pt: '<rect width="30" height="20" fill="#009b3a"/><path d="M15 2.4L27.4 10L15 17.6L2.6 10Z" fill="#ffdf00"/><circle cx="15" cy="10" r="4.3" fill="#002776"/><path d="M11 9.2Q15 7.6 19 10.8" stroke="#fff" stroke-width="0.9" fill="none"/>'
  };

  var CHEVRON = '<svg class="idioma-flecha" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function bandera(cod) { return '<svg class="idioma-bandera" viewBox="0 0 30 20" aria-hidden="true" focusable="false">' + BANDERAS[cod] + '</svg>'; }

  function estilos() {
    var s = document.createElement('style');
    s.textContent =
      '.idiomas{position:relative;margin-left:4px;flex:none}' +
      '.idiomas-flotante{position:fixed;top:8px;right:10px;z-index:950;margin:0}' +
      '.idioma-actual{display:flex;align-items:center;gap:6px;cursor:pointer;color:#004b8d;padding:5px 8px;border-radius:14px;border:1px solid rgba(0,75,141,.45);background:linear-gradient(180deg,rgba(255,255,255,.95),rgba(214,234,252,.9));box-shadow:0 2px 5px rgba(0,0,0,.2)}' +
      '.idioma-actual:hover{background:#fff}' +
      '.idioma-bandera{width:26px;height:17px;border-radius:3px;box-shadow:0 0 0 1px rgba(0,0,0,.35);display:block}' +
      '.idioma-flecha{width:14px;height:14px;transition:transform .15s}' +
      '.idioma-actual[aria-expanded="true"] .idioma-flecha{transform:rotate(180deg)}' +
      '.idioma-menu{position:absolute;right:0;top:calc(100% + 6px);z-index:960;min-width:160px;list-style:none;margin:0;padding:6px;background:#fff;border:1px solid #8baac9;border-radius:10px;box-shadow:0 8px 22px rgba(0,0,0,.3)}' +
      '.idioma-menu[hidden]{display:none}' +
      '.idioma-op{display:flex;align-items:center;gap:10px;width:100%;text-align:left;cursor:pointer;background:none;border:0;border-radius:8px;padding:7px 8px;color:#12355b;font-weight:bold}' +
      '.idioma-op:hover,.idioma-op:focus-visible{background:#e0f0ff;outline:none}' +
      '.idioma-op[aria-selected="true"]{background:#d7ecff}' +
      '.idioma-actual:focus-visible{outline:3px solid #1a73e8;outline-offset:2px}';
    document.head.appendChild(s);
  }

  var menu = null, botonActual = null;
  function cerrarMenu() { if (!menu) return; menu.hidden = true; botonActual.setAttribute('aria-expanded', 'false'); }
  function abrirMenu() { menu.hidden = false; botonActual.setAttribute('aria-expanded', 'true'); var sel = menu.querySelector('[aria-selected="true"]'); if (sel) sel.focus(); }

  function crearSelector() {
    if (document.querySelector('.idiomas')) return;
    var caja = document.createElement('div');
    caja.className = 'idiomas';
    caja.setAttribute('data-no-traducir', '');

    botonActual = document.createElement('button');
    botonActual.type = 'button';
    botonActual.className = 'idioma-actual';
    botonActual.setAttribute('aria-haspopup', 'listbox');
    botonActual.setAttribute('aria-expanded', 'false');
    botonActual.onclick = function (e) { e.stopPropagation(); if (menu.hidden) abrirMenu(); else cerrarMenu(); };

    menu = document.createElement('ul');
    menu.className = 'idioma-menu';
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;
    IDIOMAS.forEach(function (cod) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'idioma-op';
      b.setAttribute('role', 'option');
      b.setAttribute('data-idioma', cod);
      b.innerHTML = bandera(cod) + '<span>' + NOMBRES[cod] + '</span>';
      b.onclick = function () { cambiarIdioma(cod); cerrarMenu(); botonActual.focus(); };
      li.appendChild(b);
      menu.appendChild(li);
    });
    caja.appendChild(botonActual);
    caja.appendChild(menu);

    document.addEventListener('click', function (e) { if (!caja.contains(e.target)) cerrarMenu(); });
    caja.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { cerrarMenu(); botonActual.focus(); }
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !menu.hidden) {
        var ops = Array.prototype.slice.call(menu.querySelectorAll('.idioma-op')), i = ops.indexOf(document.activeElement);
        e.preventDefault(); ops[(i + (e.key === 'ArrowDown' ? 1 : ops.length - 1)) % ops.length].focus();
      }
    });

    // Va en la misma barra de arriba, al lado de los botones de sesión.
    var auth = document.querySelector('.top-header .user-quick-auth');
    if (auth && auth.parentNode) auth.parentNode.insertBefore(caja, auth.nextSibling);
    else { caja.className += ' idiomas-flotante'; document.body.appendChild(caja); }
    marcarBoton();
  }

  function marcarBoton() {
    if (!botonActual) return;
    botonActual.innerHTML = bandera(idioma) + CHEVRON;
    botonActual.title = NOMBRES[idioma];
    botonActual.setAttribute('aria-label', NOMBRES[idioma]);
    Array.prototype.forEach.call(menu.querySelectorAll('.idioma-op'), function (b) {
      b.setAttribute('aria-selected', b.getAttribute('data-idioma') === idioma ? 'true' : 'false');
    });
  }

  function cambiarIdioma(cod) {
    if (IDIOMAS.indexOf(cod) < 0) return;
    idioma = cod;
    try { localStorage.setItem('idioma', cod); } catch (e) { /* modo privado */ }
    document.documentElement.setAttribute('lang', cod);
    marcarBoton();
    procesar(document.body);
    procesar(document.head);
    try { window.dispatchEvent(new CustomEvent('c4u-idioma', { detail: cod })); } catch (e) { /* navegador viejo */ }
  }

  function iniciar() {
    estilos();
    crearSelector();
    document.documentElement.setAttribute('lang', idioma);
    procesar(document.body);
    procesar(document.head);
    observador.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
  }

  window.C4U_IDIOMA = { cambiar: cambiarIdioma, actual: function () { return idioma; }, traducir: traducir };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();