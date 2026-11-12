/* Clothes4Us - Preguntas frecuentes (Ayuda).
   Se muestran de a pocas y con "Ver más preguntas" van saliendo las demás.
   Cada pregunta está en español / English / Português: [es, en, pt]. */
(function () {
  'use strict';
  var PREGUNTAS = [
    { q: ['¿Qué es Clothes4Us?', 'What is Clothes4Us?', 'O que é o Clothes4Us?'],
      a: ['Es una feria virtual y red social para comprar, vender e intercambiar ropa usada y darle una segunda vida. También podés anunciar ferias presenciales.', 'It is a virtual fair and social network to buy, sell and swap used clothes and give them a second life. You can also announce in-person fairs.', 'É uma feira virtual e rede social para comprar, vender e trocar roupas usadas e dar a elas uma segunda vida. Você também pode anunciar feiras presenciais.'] },
    { q: ['¿Necesito una cuenta para mirar?', 'Do I need an account to browse?', 'Preciso de uma conta para olhar?'],
      a: ['No. Podés recorrer todo el sitio sin cuenta. Para publicar, comentar, guardar, usar el carrito o chatear tenés que iniciar sesión o registrarte.', 'No. You can browse the whole site without an account. To post, comment, save, use the cart or chat you need to log in or sign up.', 'Não. Você pode navegar por todo o site sem conta. Para publicar, comentar, salvar, usar o carrinho ou conversar precisa entrar ou se cadastrar.'] },
    { q: ['¿Cómo me registro?', 'How do I sign up?', 'Como me cadastro?'],
      a: ['Tocá el botón de arriba a la derecha, elegí "Registrarte", completá un nombre de usuario, tu correo o teléfono y una contraseña, y listo.', 'Tap the button at the top right, choose "Sign up", fill in a username, your email or phone and a password, and you are done.', 'Toque no botão do canto superior direito, escolha "Cadastrar-se", preencha um nome de usuário, seu e-mail ou telefone e uma senha, e pronto.'] },
    { q: ['¿Cómo elijo mi nombre de usuario?', 'How do I choose my username?', 'Como escolho meu nome de usuário?'],
      a: ['Tiene que tener entre 4 y 20 caracteres, con al menos una letra y un símbolo (_ . - # $ !). Por ejemplo: lola_vintage. Si dice que no está disponible, probá con otro.', 'It must be 4 to 20 characters long, with at least one letter and one symbol (_ . - # $ !). For example: lola_vintage. If it says it is not available, try another one.', 'Deve ter entre 4 e 20 caracteres, com pelo menos uma letra e um símbolo (_ . - # $ !). Por exemplo: lola_vintage. Se disser que não está disponível, tente outro.'] },
    { q: ['¿Qué requisitos tiene la contraseña?', 'What are the password requirements?', 'Quais são os requisitos da senha?'],
      a: ['8 o más caracteres, con una mayúscula, una minúscula, un número y un símbolo. Mientras la escribís, el formulario te muestra qué te falta.', '8 or more characters, with an uppercase letter, a lowercase letter, a number and a symbol. While you type it, the form shows you what is missing.', '8 ou mais caracteres, com uma maiúscula, uma minúscula, um número e um símbolo. Enquanto você digita, o formulário mostra o que falta.'] },
    { q: ['Me olvidé mi contraseña', 'I forgot my password', 'Esqueci minha senha'],
      a: ['En la pantalla de inicio de sesión tocá "¿Te olvidaste tu contraseña?". Te enviamos un código de 6 números al correo con el que te registraste. El código vence a los 15 minutos.', 'On the login screen tap "Forgot your password?". We send a 6-digit code to the email you signed up with. The code expires after 15 minutes.', 'Na tela de login toque em "Esqueceu sua senha?". Enviamos um código de 6 números para o e-mail com que você se cadastrou. O código expira em 15 minutos.'] },
    { q: ['No me llega el código de recuperación', 'The recovery code does not arrive', 'O código de recuperação não chega'],
      a: ['Revisá la carpeta de spam o correo no deseado y fijate que hayas escrito bien tu correo. Si pasaron 15 minutos, pedí uno nuevo con "Pedir otro".', 'Check your spam folder and make sure you typed your email correctly. If 15 minutes have passed, ask for a new one with "Ask for another".', 'Verifique a pasta de spam e confira se digitou o e-mail corretamente. Se passaram 15 minutos, peça um novo em "Pedir outro".'] },
    { q: ['¿Cómo cambio mi contraseña?', 'How do I change my password?', 'Como altero minha senha?'],
      a: ['Entrá a "Mi Perfil" y buscá el panel "Seguridad: cambiar contraseña". Escribí la actual, la nueva dos veces y tocá "Cambiar contraseña". Se cierra tu sesión en otros dispositivos.', 'Go to "My Profile" and find the "Security: change password" panel. Type your current one, the new one twice and tap "Change password". Your session on other devices is closed.', 'Acesse "Meu Perfil" e procure o painel "Segurança: alterar senha". Digite a atual, a nova duas vezes e toque em "Alterar senha". Sua sessão em outros dispositivos é encerrada.'] },
    { q: ['¿Mi contraseña está segura?', 'Is my password safe?', 'Minha senha está segura?'],
      a: ['Sí. Nunca guardamos tu contraseña tal cual: se guarda cifrada, así que nadie puede leerla. Igual, no la compartas con nadie y no uses la misma en todos lados.', 'Yes. We never store your password as it is: it is stored encrypted, so nobody can read it. Still, do not share it with anyone and do not use the same one everywhere.', 'Sim. Nunca guardamos sua senha como ela é: ela é guardada criptografada, então ninguém pode lê-la. Mesmo assim, não a compartilhe e não use a mesma em todo lugar.'] },
    { q: ['¿Cómo cierro sesión?', 'How do I log out?', 'Como saio da conta?'],
      a: ['Tocá "Salir" arriba a la derecha, al lado de tu nombre.', 'Tap "Log out" at the top right, next to your name.', 'Toque em "Sair" no canto superior direito, ao lado do seu nome.'] },
    { q: ['¿Cómo publico una prenda o trueque?', 'How do I post an item or swap?', 'Como publico uma peça ou troca?'],
      a: ['Iniciá sesión y, desde "Inicio" o "Mi Perfil", completá el título, la descripción, el precio (o $0 para intercambio) y la categoría. Sumá una foto si querés y tocá "Publicar".', 'Log in and, from "Home" or "My Profile", fill in the title, description, price (or $0 for a swap) and category. Add a photo if you like and tap "Post".', 'Entre e, em "Início" ou "Meu Perfil", preencha o título, a descrição, o preço (ou $0 para troca) e a categoria. Adicione uma foto se quiser e toque em "Publicar".'] },
    { q: ['¿Qué es un trueque?', 'What is a swap?', 'O que é uma troca?'],
      a: ['Es cambiar una prenda por otra sin plata. Para ofrecerlo, publicá con precio $0 y contá en la descripción qué buscás a cambio.', 'It is exchanging one item for another without money. To offer one, post with a price of $0 and say in the description what you are looking for in return.', 'É trocar uma peça por outra sem dinheiro. Para oferecer, publique com preço $0 e conte na descrição o que você procura em troca.'] },
    { q: ['¿Cómo anuncio una feria presencial?', 'How do I announce an in-person fair?', 'Como anuncio uma feira presencial?'],
      a: ['Al publicar, elegí la categoría "Anuncio / Feria presencial". No lleva precio: contá en el texto la fecha, la hora y el lugar. Las demás personas pueden escribirte con el botón de mensaje.', 'When posting, choose the category "Announcement / In-person fair". It has no price: say the date, time and place in the text. Other people can write to you with the message button.', 'Ao publicar, escolha a categoria "Anúncio / Feira presencial". Não leva preço: conte no texto a data, a hora e o local. As outras pessoas podem escrever para você pelo botão de mensagem.'] },
    { q: ['¿Cuántas fotos puedo subir?', 'How many photos can I upload?', 'Quantas fotos posso enviar?'],
      a: ['Una foto por publicación. Si es muy grande, el sitio la achica solo para que cargue rápido.', 'One photo per post. If it is very large, the site shrinks it automatically so it loads fast.', 'Uma foto por publicação. Se for muito grande, o site a reduz automaticamente para carregar rápido.'] },
    { q: ['¿Puedo editar o borrar una publicación?', 'Can I edit or delete a post?', 'Posso editar ou apagar uma publicação?'],
      a: ['Sí, solo las tuyas. En tu publicación vas a ver los botones "Editar" y "Eliminar". Al eliminar se borran también sus comentarios.', 'Yes, only your own. On your post you will see the "Edit" and "Delete" buttons. Deleting also removes its comments.', 'Sim, somente as suas. Na sua publicação você verá os botões "Editar" e "Excluir". Ao excluir, os comentários também são apagados.'] },
    { q: ['¿Cómo marco una prenda como vendida?', 'How do I mark an item as sold?', 'Como marco uma peça como vendida?'],
      a: ['En tu publicación tocá "Marcar vendida". Va a aparecer la etiqueta VENDIDA y nadie podrá agregarla al carrito. Si te arrepentís, tocá "Reactivar".', 'On your post tap "Mark as sold". The SOLD label will appear and nobody will be able to add it to the cart. If you change your mind, tap "Reactivate".', 'Na sua publicação toque em "Marcar como vendida". Aparecerá a etiqueta VENDIDA e ninguém poderá adicioná-la ao carrinho. Se mudar de ideia, toque em "Reativar".'] },
    { q: ['¿Cómo busco y filtro publicaciones?', 'How do I search and filter posts?', 'Como busco e filtro publicações?'],
      a: ['En "Inicio" abrí el panel "Filtros de Búsqueda": elegí un rango de precio, las categorías y si querés ver solo trueques. Después tocá "Aplicar Filtros".', 'On "Home" open the "Search Filters" panel: choose a price range, the categories and whether you want to see only swaps. Then tap "Apply Filters".', 'Em "Início" abra o painel "Filtros de Busca": escolha uma faixa de preço, as categorias e se quer ver apenas trocas. Depois toque em "Aplicar Filtros".'] },
    { q: ['¿Cómo guardo una publicación para después?', 'How do I save a post for later?', 'Como salvo uma publicação para depois?'],
      a: ['Tocá "Guardar" en la publicación. Todas las que guardes las encontrás en la sección "Guardados" del menú.', 'Tap "Save" on the post. You will find everything you save in the "Saved" section of the menu.', 'Toque em "Salvar" na publicação. Tudo o que você salvar fica na seção "Salvos" do menu.'] },
    { q: ['¿Cómo funciona el carrito?', 'How does the cart work?', 'Como funciona o carrinho?'],
      a: ['Agregás las prendas que te interesan y Clothes4Us te muestra el total estimado. No es una compra automática: sirve para tener todo junto antes de hablar con cada vendedor.', 'You add the items you like and Clothes4Us shows you the estimated total. It is not an automatic purchase: it helps you keep everything together before talking to each seller.', 'Você adiciona as peças que lhe interessam e o Clothes4Us mostra o total estimado. Não é uma compra automática: serve para ter tudo junto antes de falar com cada vendedor.'] },
    { q: ['¿Se paga dentro de Clothes4Us?', 'Is payment made inside Clothes4Us?', 'O pagamento é feito dentro do Clothes4Us?'],
      a: ['No. El sitio conecta a compradores y vendedores. El pago y la entrega los acordás por chat directamente con cada vendedor.', 'No. The site connects buyers and sellers. Payment and delivery are agreed by chat directly with each seller.', 'Não. O site conecta compradores e vendedores. O pagamento e a entrega são combinados por chat diretamente com cada vendedor.'] },
    { q: ['¿Cómo contacto a un vendedor?', 'How do I contact a seller?', 'Como entro em contato com um vendedor?'],
      a: ['Tocá "Contactar" en la publicación. Se abre un chat con esa persona y ya queda indicado de qué publicación hablan.', 'Tap "Contact" on the post. A chat opens with that person and it already shows which post you are talking about.', 'Toque em "Contatar" na publicação. Abre-se uma conversa com essa pessoa já indicando de qual publicação vocês falam.'] },
    { q: ['¿Cómo funcionan los chats?', 'How do chats work?', 'Como funcionam as conversas?'],
      a: ['En "Chats" ves tus conversaciones. Elegí una, escribí tu mensaje y mandalo. Podés enviar fotos con el botón de cámara y emojis con el de carita. También podés buscar a otra persona por su nombre.', 'In "Chats" you see your conversations. Pick one, write your message and send it. You can send photos with the camera button and emojis with the smiley button. You can also search for another person by name.', 'Em "Conversas" você vê suas conversas. Escolha uma, escreva sua mensagem e envie. Você pode enviar fotos com o botão de câmera e emojis com o de carinha. Também pode buscar outra pessoa pelo nome.'] },
    { q: ['¿Cómo comento una publicación?', 'How do I comment on a post?', 'Como comento uma publicação?'],
      a: ['Tocá "Comentarios" en la publicación, escribí tu comentario y tocá "Comentar". Podés borrar tus propios comentarios.', 'Tap "Comments" on the post, write your comment and tap "Comment". You can delete your own comments.', 'Toque em "Comentários" na publicação, escreva seu comentário e toque em "Comentar". Você pode apagar seus próprios comentários.'] },
    { q: ['¿Cómo califico a un usuario?', 'How do I rate a user?', 'Como avalio um usuário?'],
      a: ['Entrá al perfil de la persona (tocando su nombre) y elegí de 1 a 5 estrellas. No podés calificarte a vos mismo.', 'Go to the person\'s profile (by tapping their name) and choose 1 to 5 stars. You cannot rate yourself.', 'Acesse o perfil da pessoa (tocando no nome) e escolha de 1 a 5 estrelas. Você não pode avaliar a si mesmo.'] },
    { q: ['¿Cómo cambio mi nombre, foto o descripción?', 'How do I change my name, photo or description?', 'Como altero meu nome, foto ou descrição?'],
      a: ['Entrá a "Mi Perfil", editá lo que quieras y tocá "Guardar cambios".', 'Go to "My Profile", edit what you want and tap "Save changes".', 'Acesse "Meu Perfil", edite o que quiser e toque em "Salvar alterações".'] },
    { q: ['¿Cómo personalizo mi perfil con colores y fondo?', 'How do I customize my profile with colors and a background?', 'Como personalizo meu perfil com cores e fundo?'],
      a: ['En "Mi Perfil", panel "Personalizar mi perfil", elegí uno de los temas o tocá el círculo de la paleta para elegir tus propios 3 colores. También podés subir una imagen de fondo.', 'In "My Profile", "Customize my profile" panel, choose one of the themes or tap the palette circle to pick your own 3 colors. You can also upload a background image.', 'Em "Meu Perfil", painel "Personalizar meu perfil", escolha um dos temas ou toque no círculo da paleta para escolher suas próprias 3 cores. Você também pode enviar uma imagem de fundo.'] },
    { q: ['¿Quién ve mi tema y mi fondo?', 'Who sees my theme and background?', 'Quem vê meu tema e meu fundo?'],
      a: ['Cualquier persona que entre a tu perfil. Es como en las redes clásicas: cada uno decora su espacio. Lo demás del sitio se ve normal para todos.', 'Anyone who visits your profile. It is like in the classic social networks: everyone decorates their own space. The rest of the site looks normal to everyone.', 'Qualquer pessoa que visitar seu perfil. É como nas redes clássicas: cada um decora o seu espaço. O resto do site aparece normal para todos.'] },
    { q: ['¿Cómo bloqueo a alguien?', 'How do I block someone?', 'Como bloqueio alguém?'],
      a: ['Entrá a su perfil o abrí el chat con esa persona y tocá "Bloquear". No vas a ver sus publicaciones y no podrá escribirte. Podés desbloquearla cuando quieras.', 'Go to their profile or open the chat with that person and tap "Block". You will not see their posts and they will not be able to message you. You can unblock them whenever you want.', 'Acesse o perfil ou abra a conversa com essa pessoa e toque em "Bloquear". Você não verá as publicações dela e ela não poderá escrever para você. Você pode desbloquear quando quiser.'] },
    { q: ['¿Cómo denuncio una publicación o un usuario?', 'How do I report a post or a user?', 'Como denuncio uma publicação ou um usuário?'],
      a: ['En cada publicación hay un botón con una banderita arriba a la derecha. Tocalo y contanos el motivo. Para denunciar a una persona, usá "Denunciar" en su perfil o en el chat.', 'On every post there is a flag button at the top right. Tap it and tell us the reason. To report a person, use "Report" on their profile or in the chat.', 'Em cada publicação há um botão com uma bandeirinha no canto superior direito. Toque nele e conte o motivo. Para denunciar uma pessoa, use "Denunciar" no perfil dela ou na conversa.'] },
    { q: ['¿Qué pasa después de denunciar?', 'What happens after I report something?', 'O que acontece depois de denunciar?'],
      a: ['Tu denuncia le llega al equipo de Clothes4Us para que la revise. Mientras tanto, podés bloquear a la persona para no volver a verla.', 'Your report goes to the Clothes4Us team to be reviewed. In the meantime, you can block the person so you do not see them again.', 'Sua denúncia chega à equipe do Clothes4Us para ser analisada. Enquanto isso, você pode bloquear a pessoa para não vê-la mais.'] },
    { q: ['Consejos para comprar seguro', 'Tips for buying safely', 'Dicas para comprar com segurança'],
      a: ['Pedí fotos extra de la prenda, preguntá por el estado y el talle, desconfiá de precios demasiado bajos y no pagues por adelantado a alguien que no conocés. Si algo no te cierra, denunciá la publicación.', 'Ask for extra photos of the item, ask about its condition and size, be wary of prices that are too low and do not pay in advance to someone you do not know. If something feels off, report the post.', 'Peça fotos extras da peça, pergunte sobre o estado e o tamanho, desconfie de preços muito baixos e não pague adiantado a alguém que você não conhece. Se algo não parecer certo, denuncie a publicação.'] },
    { q: ['Consejos para vender seguro', 'Tips for selling safely', 'Dicas para vender com segurança'],
      a: ['Sacá fotos claras, describí bien el estado y los defectos, y coordiná encuentros en lugares públicos y con gente. No compartas datos personales de más ni claves por chat.', 'Take clear photos, describe the condition and any flaws well, and arrange meetings in public places with other people around. Do not share extra personal data or passwords in chat.', 'Tire fotos nítidas, descreva bem o estado e os defeitos, e combine encontros em locais públicos e com movimento. Não compartilhe dados pessoais a mais nem senhas pelo chat.'] },
    { q: ['¿Cómo cambio el idioma?', 'How do I change the language?', 'Como mudo o idioma?'],
      a: ['Tocá la banderita con la flechita, arriba a la derecha, y elegí Español, English o Português. El sitio se acuerda de tu elección.', 'Tap the little flag with the arrow, at the top right, and choose Español, English or Português. The site remembers your choice.', 'Toque na bandeirinha com a setinha, no canto superior direito, e escolha Español, English ou Português. O site lembra da sua escolha.'] },
    { q: ['¿Puedo usar Clothes4Us desde el celular?', 'Can I use Clothes4Us on my phone?', 'Posso usar o Clothes4Us no celular?'],
      a: ['Sí. El sitio se adapta a celulares y tablets: en pantallas chicas los botones se muestran solo con íconos y los filtros quedan arriba, plegados.', 'Yes. The site adapts to phones and tablets: on small screens the buttons show only icons and the filters stay at the top, collapsed.', 'Sim. O site se adapta a celulares e tablets: em telas pequenas os botões mostram apenas ícones e os filtros ficam no topo, recolhidos.'] },
    { q: ['¿Por qué a veces tarda en abrir?', 'Why does it sometimes take a while to open?', 'Por que às vezes demora para abrir?'],
      a: ['Si nadie entró durante un rato, el servidor se "duerme" y puede tardar hasta un minuto en despertar. Esperá un momento y se abre normal.', 'If nobody visited for a while, the server "falls asleep" and can take up to a minute to wake up. Wait a moment and it opens normally.', 'Se ninguém entrou por um tempo, o servidor "dorme" e pode levar até um minuto para acordar. Aguarde um momento e abre normalmente.'] },
    { q: ['¿Cómo dono ropa?', 'How do I donate clothes?', 'Como doro roupas?'],
      a: ['Entrá a la sección "Donar" del menú. Ahí encontrás organizaciones que reciben indumentaria; el botón "Ir a donar" te lleva a su página y se abre en otra pestaña.', 'Go to the "Donate" section of the menu. There you will find organizations that accept clothing; the "Go donate" button takes you to their page and opens in a new tab.', 'Acesse a seção "Doar" do menu. Lá você encontra organizações que recebem roupas; o botão "Ir doar" leva à página delas e abre em outra aba.'] },
    { q: ['¿Cómo elimino mi cuenta?', 'How do I delete my account?', 'Como excluo minha conta?'],
      a: ['Por ahora, escribinos a soporte desde el correo con el que te registraste y lo gestionamos.', 'For now, write to support from the email you signed up with and we will take care of it.', 'Por enquanto, escreva para o suporte usando o e-mail com que você se cadastrou e nós cuidamos disso.'] },
    { q: ['Vi algo que no corresponde', 'I saw something that is not right', 'Vi algo que não está certo'],
      a: ['Usá el botón de la banderita de la publicación o "Denunciar" en el perfil o el chat. También podés bloquear a la persona.', 'Use the flag button on the post or "Report" on the profile or chat. You can also block the person.', 'Use o botão da bandeirinha da publicação ou "Denunciar" no perfil ou na conversa. Você também pode bloquear a pessoa.'] },
    { q: ['¿Cómo respondo a un comentario?', 'How do I reply to a comment?', 'Como respondo a um comentário?'],
      a: ['Abrí los comentarios de la publicación y tocá "Responder" debajo del comentario. Aparece "Respondiendo a @usuario" y tu mensaje queda debajo del original.', 'Open the post comments and tap "Reply" under the comment. "Replying to @user" appears and your message goes under the original.', 'Abra os comentários da publicação e toque em "Responder" abaixo do comentário. Aparece "Respondendo a @usuário" e sua mensagem fica abaixo do original.'] },
    { q: ['¿Cómo doy "Me gusta" o "No me gusta" a un comentario?', 'How do I like or dislike a comment?', 'Como curto ou não curto um comentário?'],
      a: ['Debajo de cada comentario hay un pulgar hacia arriba y uno hacia abajo. Tocá el mismo otra vez para sacar tu voto, o el otro para cambiarlo.', 'Under each comment there is a thumbs up and a thumbs down. Tap the same one again to remove your vote, or the other to switch.', 'Abaixo de cada comentário há um polegar para cima e um para baixo. Toque no mesmo de novo para remover seu voto, ou no outro para trocar.'] },
    { q: ['¿Puedo comentar con una foto?', 'Can I comment with a photo?', 'Posso comentar com uma foto?'],
      a: ['Sí. En la caja de comentarios tocá el ícono de la cámara, elegí la imagen y enviá. Si querés sacarla antes de enviar, tocá la vista previa.', 'Yes. In the comment box tap the camera icon, pick the image and send. To remove it before sending, tap the preview.', 'Sim. Na caixa de comentários toque no ícone da câmera, escolha a imagem e envie. Para removê-la antes de enviar, toque na pré-visualização.'] },
    { q: ['¿Cómo denuncio un comentario?', 'How do I report a comment?', 'Como denuncio um comentário?'],
      a: ['Tocá "Denunciar" (la banderita) debajo del comentario y contanos el motivo. Si varias personas lo denuncian, queda oculto hasta que lo revisemos.', 'Tap "Report" (the flag) under the comment and tell us why. If several people report it, it stays hidden until we review it.', 'Toque em "Denunciar" (a bandeirinha) abaixo do comentário e conte o motivo. Se várias pessoas denunciarem, ele fica oculto até que o revisemos.'] },
    { q: ['¿Cómo sigo a alguien y qué son los amigos?', 'How do I follow someone and what are friends?', 'Como sigo alguém e o que são amigos?'],
      a: ['Entrá a su perfil y tocá "Seguir". Si esa persona también te sigue, se vuelven amigos. En tu perfil ves cuántos seguidores, seguidos y amigos tenés, y tocando cada número ves la lista.', 'Go to their profile and tap "Follow". If they follow you back, you become friends. On your profile you see how many followers, following and friends you have, and tapping each number shows the list.', 'Entre no perfil e toque em "Seguir". Se a pessoa também seguir você, vocês viram amigos. No seu perfil você vê quantos seguidores, seguidos e amigos tem, e tocando em cada número vê a lista.'] },
    { q: ['¿Qué es "Para vos" en el inicio?', 'What is "For you" on the home page?', 'O que é "Para você" no início?'],
      a: ['Es un inicio que mezcla publicaciones de otras personas y no repite las que ya viste. Cada vez que entrás o recargás aparecen otras nuevas. Si preferís el orden de siempre, elegí "Recientes".', 'It is a home feed that mixes posts from other people and does not repeat the ones you have seen. Each time you visit or reload, new ones appear. If you prefer the usual order, choose "Recent".', 'É um início que mistura publicações de outras pessoas e não repete as que você já viu. Cada vez que você entra ou recarrega, aparecem novas. Se preferir a ordem de sempre, escolha "Recentes".'] },
    { q: ['¿Cómo comparto una publicación?', 'How do I share a post?', 'Como compartilho uma publicação?'],
      a: ['Tocá "Compartir" en la publicación. Podés copiar el enlace o mandársela por chat a un amigo o a cualquier usuario.', 'Tap "Share" on the post. You can copy the link or send it by chat to a friend or any user.', 'Toque em "Compartilhar" na publicação. Você pode copiar o link ou enviá-la por chat a um amigo ou a qualquer usuário.'] },
    { q: ['¿Cómo fijo, silencio o vacío un chat?', 'How do I pin, mute or clear a chat?', 'Como fixo, silencio ou limpo uma conversa?'],
      a: ['Abrí el chat y usá los botones de arriba: "Fijar" lo deja arriba de la lista, "Silenciar" evita que sume al numerito del menú y "Vaciar chat" borra los mensajes solo para vos.', 'Open the chat and use the buttons at the top: "Pin" keeps it at the top of the list, "Mute" stops it from adding to the menu counter and "Clear chat" deletes the messages only for you.', 'Abra a conversa e use os botões do topo: "Fixar" a deixa no topo da lista, "Silenciar" evita que some no número do menu e "Limpar conversa" apaga as mensagens só para você.'] },
  ];

  var TEXTOS = {
    buscar: ['Buscar en la ayuda…', 'Search the help…', 'Buscar na ajuda…'],
    mas: ['Ver más preguntas', 'Show more questions', 'Ver mais perguntas'],
    restan: ['restan', 'left', 'restam'],
    mostrando: ['Mostrando', 'Showing', 'Mostrando'],
    de: ['de', 'of', 'de'],
    nada: ['No encontramos preguntas con esas palabras. Probá con otras o escribinos a soporte.', 'We did not find questions with those words. Try others or write to support.', 'Não encontramos perguntas com essas palavras. Tente outras ou escreva ao suporte.']
  };
  var POR_VEZ = 6;
  var mostradas = POR_VEZ, busqueda = '';

  function idx() {
    var l = 'es';
    try { l = (window.C4U_IDIOMA && window.C4U_IDIOMA.actual()) || localStorage.getItem('idioma') || 'es'; } catch (e) { /* nada */ }
    return l === 'en' ? 1 : l === 'pt' ? 2 : 0;
  }
  function t(k) { return TEXTOS[k][idx()]; }
  function limpio(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function pintar(foco) {
    var cont = document.getElementById('faq'), estado = document.getElementById('faqEstado'), mas = document.getElementById('faqMas'), caja = document.getElementById('faqBuscar');
    if (!cont) return;
    var i = idx(), q = limpio(busqueda.trim());
    caja.placeholder = t('buscar'); caja.setAttribute('aria-label', t('buscar'));
    var lista = PREGUNTAS.filter(function (p) { return !q || limpio(p.q[i] + ' ' + p.a[i]).indexOf(q) >= 0; });
    var visibles = q ? lista : lista.slice(0, mostradas);
    var previas = cont.children.length;
    cont.textContent = '';
    visibles.forEach(function (p, n) {
      var d = document.createElement('details');
      d.className = 'faq-item';
      var s = document.createElement('summary'); s.textContent = p.q[i];
      var r = document.createElement('p'); r.textContent = p.a[i];
      d.appendChild(s); d.appendChild(r);
      cont.appendChild(d);
      if (foco && n === previas) d.setAttribute('data-nuevo', '');
    });
    if (!lista.length) { var v = document.createElement('p'); v.className = 'sin-datos'; v.textContent = t('nada'); cont.appendChild(v); }
    estado.textContent = lista.length ? t('mostrando') + ' ' + visibles.length + ' ' + t('de') + ' ' + lista.length : '';
    var faltan = q ? 0 : lista.length - visibles.length;
    mas.hidden = faltan <= 0;
    mas.textContent = t('mas') + ' (' + faltan + ' ' + t('restan') + ')';
    if (foco) { var nuevo = cont.querySelector('[data-nuevo] summary'); if (nuevo) nuevo.focus(); }
  }

  function iniciar() {
    if (!document.getElementById('faq')) return;
    document.getElementById('faqMas').addEventListener('click', function () { mostradas += POR_VEZ; pintar(true); });
    document.getElementById('faqBuscar').addEventListener('input', function (e) { busqueda = e.target.value; pintar(false); });
    window.addEventListener('c4u-idioma', function () { pintar(false); });
    pintar(false);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();